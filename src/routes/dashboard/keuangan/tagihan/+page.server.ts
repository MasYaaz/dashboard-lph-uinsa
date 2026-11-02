import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sql } from '#lib/server/db.ts';

export interface PermohonanSiapTagihItem {
	id_daftar: string;
	nama_pu: string;
	jenis_pengajuan: string;
	skala_usaha: string;
	jumlah_produk: number;
	jumlah_outlet: number;
	alamat_outlet: string;
	jarak: number;
}

export interface TagihanItem {
	id_keuangan: number;
	id_daftar: string;
	nama_pu: string;
	no_invoice: string;
	biaya_transportasi: number;
	uang_harian: number;
	penginapan: number;
	total_biaya: number;
	catatan_revisi: string | null;
	status_pembayaran: string;
	tgl_diterbitkan: string;
}

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	if (user.role !== 'BENDAHARA') {
		throw redirect(303, '/dashboard');
	}

	try {
		const permohonanSiapTagihRaw = await sql`
			SELECT
				pa.id_daftar,
				pu.nama_pelaku_usaha AS nama_pu,
				'Pemeriksaan Halal' AS jenis_pengajuan,
				COALESCE(pu.jumlah_produk, 1) AS jumlah_produk,
				COALESCE(pu.jumlah_outlet, 1) AS jumlah_outlet,
				COALESCE(pu.alamat_outlet, '-') AS alamat_outlet,
				COALESCE(pu.jarak_dari_pusat_kota, 0) AS jarak
			FROM permohonan_audit pa
			JOIN pelaku_usaha pu ON pa.id_daftar = pu.id_daftar
			JOIN penugasan p ON pa.id_permohonan = p.id_permohonan
			LEFT JOIN keuangan_audit ka ON pa.id_permohonan = ka.id_permohonan
			WHERE ka.id_keuangan IS NULL
			ORDER BY pa.tanggal_permohonan ASC
		`;

		const daftarTagihanRaw = await sql`
			SELECT
				ka.id_keuangan,
				pa.id_daftar,
				pu.nama_pelaku_usaha AS nama_pu,
				ka.no_invoice,
				COALESCE(ka.biaya_transport_talangan, 0) AS biaya_transportasi,
				COALESCE(ka.biaya_uh_penginapan, 0) AS uang_harian,
				COALESCE(ka.biaya_tambahan, 0) AS penginapan,
				COALESCE(ka.total_biaya_final, 0) AS total_biaya,
				ka.catatan_revisi,
				ka.status_keuangan::text AS status_pembayaran,
				ka.created_at
			FROM keuangan_audit ka
			JOIN permohonan_audit pa ON ka.id_permohonan = pa.id_permohonan
			JOIN pelaku_usaha pu ON pa.id_daftar = pu.id_daftar
			ORDER BY ka.created_at DESC
		`;

		const permohonanSiapTagih: PermohonanSiapTagihItem[] = permohonanSiapTagihRaw.map((r) => ({
			id_daftar: String(r.id_daftar),
			nama_pu: String(r.nama_pu),
			jenis_pengajuan: String(r.jenis_pengajuan),
			skala_usaha: 'Mikro',
			jumlah_produk: Number(r.jumlah_produk),
			jumlah_outlet: Number(r.jumlah_outlet),
			alamat_outlet: String(r.alamat_outlet),
			jarak: Number(r.jarak)
		}));

		const daftarTagihan: TagihanItem[] = daftarTagihanRaw.map((r) => ({
			id_keuangan: Number(r.id_keuangan),
			id_daftar: String(r.id_daftar),
			nama_pu: String(r.nama_pu),
			no_invoice: String(r.no_invoice),
			biaya_transportasi: Number(r.biaya_transportasi),
			uang_harian: Number(r.uang_harian),
			penginapan: Number(r.penginapan),
			total_biaya: Number(r.total_biaya),
			catatan_revisi: r.catatan_revisi ? String(r.catatan_revisi) : null,
			status_pembayaran: String(r.status_pembayaran),
			tgl_diterbitkan: new Date(r.created_at).toLocaleDateString('id-ID', {
				day: 'numeric',
				month: 'short',
				year: 'numeric'
			})
		}));

		return { permohonanSiapTagih, daftarTagihan };
	} catch (err) {
		console.error('Error load tagihan terpadu:', err);
		return { permohonanSiapTagih: [], daftarTagihan: [] };
	}
};

export const actions = {
	terbitkanTagihan: async ({ request, locals }) => {
		const formData = await request.formData();
		const id_daftar = formData.get('id_daftar')?.toString().trim();
		const no_invoice_manual = formData.get('no_invoice')?.toString().trim();
		const biaya_transportasi = parseFloat(formData.get('biaya_transportasi')?.toString() || '0');
		const uang_harian = parseFloat(formData.get('uang_harian')?.toString() || '0');
		const penginapan = parseFloat(formData.get('penginapan')?.toString() || '0');
		const catatan = formData.get('catatan_perhitungan')?.toString().trim() || null;

		if (!id_daftar) {
			return fail(400, { success: false, error: 'Pilih Permohonan Audit terlebih dahulu.' });
		}

		const total_biaya_lph = biaya_transportasi + uang_harian;
		const total_biaya_final = total_biaya_lph + penginapan;

		if (total_biaya_final <= 0) {
			return fail(400, {
				success: false,
				error: 'Total Rincian Biaya Operasional harus lebih dari Rp 0.'
			});
		}

		const currentYear = new Date().getFullYear();
		const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
		const randomCode = Math.floor(1000 + Math.random() * 9000);
		const no_invoice = no_invoice_manual || `INV/LPH/${currentMonth}/${currentYear}/${randomCode}`;

		try {
			const checkDuplicate = await sql`
				SELECT id_keuangan FROM keuangan_audit WHERE no_invoice = ${no_invoice} LIMIT 1
			`;

			if (checkDuplicate.length > 0) {
				return fail(400, {
					success: false,
					error: `Nomor Invoice ${no_invoice} sudah pernah digunakan.`
				});
			}

			const permohonanRes = await sql`
				SELECT id_permohonan FROM permohonan_audit WHERE id_daftar = ${id_daftar} LIMIT 1
			`;

			if (permohonanRes.length === 0) {
				return fail(404, { success: false, error: 'Data permohonan audit tidak ditemukan.' });
			}

			const id_permohonan = permohonanRes[0].id_permohonan;
			const currentUserId = locals.user?.id_user || null;

			// Menggunakan nilai enum 'SIAP_VERIFIKASI' sesuai skema PostgreSQL Anda
			await sql`
				INSERT INTO keuangan_audit (
					id_permohonan,
					no_invoice,
					biaya_transport_talangan,
					biaya_uh_penginapan,
					biaya_tambahan,
					total_biaya_lph,
					total_biaya_final,
					catatan_revisi,
					status_keuangan,
					created_by
				) VALUES (
					${id_permohonan},
					${no_invoice},
					${biaya_transportasi},
					${uang_harian},
					${penginapan},
					${total_biaya_lph},
					${total_biaya_final},
					${catatan},
					'SIAP_VERIFIKASI'::status_keuangan_enum,
					${currentUserId}
				)
			`;

			return {
				success: true,
				message: `Rincian Biaya & Invoice ${no_invoice} berhasil disimpan!`
			};
		} catch (err) {
			console.error('Error terbit tagihan:', err);
			return fail(500, { success: false, error: 'Gagal menyimpan rincian biaya audit.' });
		}
	}
} satisfies Actions;
