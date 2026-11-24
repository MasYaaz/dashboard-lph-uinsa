import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Koordinat UIN Sunan Ampel Surabaya Kampus 1 (Jl. Ahmad Yani No. 117)
const UINSA_LAT = -7.32258;
const UINSA_LON = 112.73407;

function bersihkanAlamat(raw: string): string[] {
	// Normalisasi spasi setelah Jl. (misal "Jl.Kemlaten" -> "Jl. Kemlaten")
	const spasiRapih = raw.replace(/\b(jl|jln)\.?\s*/gi, 'Jalan ').trim();

	// Hapus nomor bangunan/blok/gang detail setelah angka atau garis miring (misal "IV / 20" -> "IV", "No. 123" -> "")
	const tanpaNomorDetail = spasiRapih
		.replace(/\b(no|nomor|blok|rt|rw)\.?\s*[a-z0-9/-]+/gi, '')
		.replace(/\/\s*\d+[a-z]?/gi, '')
		.replace(/\s+/g, ' ')
		.trim();

	const kandidat = new Set<string>();
	for (const base of [spasiRapih, tanpaNomorDetail]) {
		if (!base) continue;
		kandidat.add(base);
		if (!/surabaya|sidoarjo|gresik|jawa timur|indonesia/i.test(base)) {
			kandidat.add(`${base}, Surabaya`);
		}
	}
	return Array.from(kandidat);
}

async function cariKoordinat(
	query: string
): Promise<{ lat: number; lon: number; label: string } | null> {
	// 1. Coba Photon API (OpenStreetMap Geocoder yang lebih toleran & tanpa blokir ketat)
	try {
		const photonRes = await fetch(
			`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1&lat=${UINSA_LAT}&lon=${UINSA_LON}`,
			{ headers: { Accept: 'application/json' } }
		);
		if (photonRes.ok) {
			const photonData = await photonRes.json();
			const feat = photonData?.features?.[0];
			if (feat?.geometry?.coordinates?.length >= 2) {
				const [lon, lat] = feat.geometry.coordinates;
				const props = feat.properties || {};
				const labelParts = [props.name, props.street, props.district, props.city || props.county]
					.filter(Boolean)
					.slice(0, 3);
				return {
					lat: Number(lat),
					lon: Number(lon),
					label: labelParts.join(', ') || query
				};
			}
		}
	} catch (e) {
		console.warn('Photon geocoder gagal, mencoba Nominatim:', e);
	}

	// 2. Fallback ke Nominatim OpenStreetMap
	try {
		const nomRes = await fetch(
			`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=id&q=${encodeURIComponent(query)}`,
			{
				headers: {
					'User-Agent': 'Mozilla/5.0 (compatible; SIM-LPH-App/1.0)',
					Accept: 'application/json'
				}
			}
		);
		if (nomRes.ok) {
			const nomData = await nomRes.json();
			if (Array.isArray(nomData) && nomData.length > 0) {
				return {
					lat: parseFloat(nomData[0].lat),
					lon: parseFloat(nomData[0].lon),
					label: String(nomData[0].display_name || query)
						.split(',')
						.slice(0, 3)
						.join(',')
				};
			}
		}
	} catch (e) {
		console.warn('Nominatim geocoder gagal:', e);
	}

	return null;
}

export const GET: RequestHandler = async ({ url }) => {
	const alamat = url.searchParams.get('alamat')?.trim();

	if (!alamat) {
		return json({ error: 'Alamat outlet wajib diisi.' }, { status: 400 });
	}

	try {
		const daftarQuery = bersihkanAlamat(alamat);
		let koordinat: { lat: number; lon: number; label: string } | null = null;

		for (const q of daftarQuery) {
			koordinat = await cariKoordinat(q);
			if (koordinat) break;
		}

		if (!koordinat) {
			return json(
				{
					error:
						'Alamat tidak ditemukan di peta. Coba sertakan nama kelurahan/kota (misal: "Kemlaten, Karangpilang, Surabaya").'
				},
				{ status: 404 }
			);
		}

		// Hitung jarak rute jalan darat (OSRM Driving Route) dari UINSA Kampus 1
		const routeRes = await fetch(
			`https://router.project-osrm.org/route/v1/driving/${UINSA_LON},${UINSA_LAT};${koordinat.lon},${koordinat.lat}?overview=false`
		);

		if (!routeRes.ok) {
			// Fallback jarak Haversine * 1.25 (faktor kelokan jalan) jika OSRM sedang sibuk
			const R = 6371;
			const dLat = ((koordinat.lat - UINSA_LAT) * Math.PI) / 180;
			const dLon = ((koordinat.lon - UINSA_LON) * Math.PI) / 180;
			const a =
				Math.sin(dLat / 2) ** 2 +
				Math.cos((UINSA_LAT * Math.PI) / 180) *
					Math.cos((koordinat.lat * Math.PI) / 180) *
					Math.sin(dLon / 2) ** 2;
			const straightKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
			const approxKm = Math.round(straightKm * 1.25 * 10) / 10;

			return json({
				distanceKm: approxKm,
				matchedAddress: `${koordinat.label} (estimasi jarak)`
			});
		}

		const routeData = await routeRes.json();
		if (routeData.code !== 'Ok' || !routeData.routes?.length) {
			return json({ error: 'Rute jalan ke lokasi tersebut tidak ditemukan.' }, { status: 404 });
		}

		const distanceMeters = Number(routeData.routes[0].distance);
		const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;

		return json({
			distanceKm,
			matchedAddress: koordinat.label
		});
	} catch (err) {
		console.error('Server error hitung-jarak:', err);
		return json(
			{ error: 'Terjadi kesalahan saat menghitung jarak otomatis. Silakan isi manual.' },
			{ status: 500 }
		);
	}
};
