import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sql } from '#lib/server/db.ts';
import type { JenisTransaksiEnum } from '#lib/types.ts';

export interface PermohonanSiapTagihItem {
	id_permohonan: number;
	id_daftar: string;
	nama_pu: string;
	skala_usaha: string;
}

interface ItemTransaksiInput {
	jenis_transaksi: JenisTransaksiEnum;
	jumlah_uang: number;
	catatan?: string;
}

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	if (user.role !== 'BENDAHARA' && user.role !== 'ADMINISTRASI') {
		throw redirect(303, '/dashboard');
	}

	try {
		// Ambil permohonan audit yang terdaftar
		const permohonanRaw = await sql`
			SELECT DISTINCT pa.id_permohonan, pa.id_daftar, pu.nama_pelaku_usaha AS nama_pu
			FROM permohonan_audit pa
			JOIN pelaku_usaha pu ON pa.id_daftar = pu.id_daftar
			ORDER BY pa.id_permohonan DESC
		`;

		const permohonanSiapTagih: PermohonanSiapTagihItem[] = permohonanRaw.map((row) => ({
			id_permohonan: Number(row.id_permohonan),
			id_daftar: String(row.id_daftar),
			nama_pu: String(row.nama_pu),
			skala_usaha: 'Pelaku Usaha'
		}));

		return { permohonanSiapTagih };
	} catch (err) {
		console.error('Error loading permohonan siap tagih:', err);
		return { permohonanSiapTagih: [] };
	}
};

export const actions = {
	terbitkanTagihan: async ({ request, cookies, locals }) => {
		const formData = await request.formData();
		const id_daftar = formData.get('id_daftar')?.toString().trim();
		const no_invoice = formData.get('no_invoice')?.toString().trim();
		const itemsJson = formData.get('items_json')?.toString().trim();

		if (!id_daftar || !no_invoice || !itemsJson) {
			return fail(400, {
				error: 'Permohonan Audit, No Invoice, dan Rincian Komponen wajib diisi.'
			});
		}

		let items: ItemTransaksiInput[];
		try {
			items = JSON.parse(itemsJson);
		} catch {
			return fail(400, { error: 'Format komponen rincian biaya tidak valid.' });
		}

		if (!Array.isArray(items) || items.length === 0) {
			return fail(400, { error: 'Minimal harus memasukkan 1 komponen biaya tagihan.' });
		}

		// Filter item yang nominalnya valid > 0
		const validItems = items.filter((item) => Number(item.jumlah_uang) > 0);
		if (validItems.length === 0) {
			return fail(400, { error: 'Nominal komponen biaya harus lebih besar dari Rp 0.' });
		}

		// Hitung akumulasi total tagihan invoice
		const totalTagihan = validItems.reduce((acc, item) => acc + Number(item.jumlah_uang), 0);

		const userIdStr =
			cookies.get('session_user_id') || (locals.user?.id_user ? String(locals.user.id_user) : null);
		const currentUserId = userIdStr ? parseInt(userIdStr) : null;

		try {
			await sql.begin(async (tx) => {
				// 1. Cari id_permohonan berdasarkan id_daftar
				const permohonan = await tx`
					SELECT id_permohonan
					FROM permohonan_audit
					WHERE id_daftar = ${id_daftar}
					LIMIT 1
				`;

				if (permohonan.length === 0) {
					throw new Error(`Permohonan audit dengan ID ${id_daftar} tidak ditemukan.`);
				}

				const idPermohonan = Number(permohonan[0].id_permohonan);

				// 2. Insert Header Invoice ke `keuangan_audit`
				const resHeader = await tx`
					INSERT INTO keuangan_audit (
						id_permohonan,
						no_invoice,
						total_tagihan,
						status_keuangan,
						created_by
					) VALUES (
						${idPermohonan},
						${no_invoice},
						${totalTagihan},
						'SIAP_VERIFIKASI',
						${currentUserId}
					)
					RETURNING id_keuangan;
				`;

				const idKeuangan = Number(resHeader[0].id_keuangan);

				// 3. Insert Seluruh Item Rincian Biaya ke `detail_keuangan_audit`
				for (const item of validItems) {
					const keteranganFinal = item.catatan ? item.catatan.trim() : null;
					await tx`
						INSERT INTO detail_keuangan_audit (
							id_keuangan,
							jenis_transaksi,
							jumlah_uang,
							keterangan
						) VALUES (
							${idKeuangan},
							${item.jenis_transaksi}::jenis_transaksi_enum,
							${Number(item.jumlah_uang)},
							${keteranganFinal}
						);
					`;
				}
			});
		} catch (err) {
			console.error('Error insert tagihan keuangan header-detail:', err);
			return fail(500, {
				error: 'Terjadi kesalahan sistem saat melepaskan/menerbitkan invoice tagihan.'
			});
		}

		// Direct redirect ke list tagihan utama setelah penerbitan invoice berhasil
		throw redirect(303, '/dashboard/tagihan');
	}
} satisfies Actions;
