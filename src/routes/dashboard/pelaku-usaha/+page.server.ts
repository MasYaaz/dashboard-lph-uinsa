import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sql } from '#lib/server/db.ts';
import type { PelakuUsaha } from '#lib/types.ts';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	if (user.role !== 'ADMINISTRASI') {
		throw redirect(303, '/dashboard');
	}

	try {
		const result = await sql<PelakuUsaha[]>`
			SELECT
				id_daftar,
				nama_pelaku_usaha,
				jumlah_produk,
				jumlah_outlet,
				alamat_outlet,
				jarak_dari_pusat_kota,
				kontak_penyelia,
				created_at
			FROM pelaku_usaha
			ORDER BY created_at DESC
		`;

		return {
			pelakuUsahaList: result.map((row) => ({
				id_daftar: String(row.id_daftar),
				nama_pelaku_usaha: String(row.nama_pelaku_usaha),
				jumlah_produk: Number(row.jumlah_produk),
				jumlah_outlet: Number(row.jumlah_outlet),
				alamat_outlet: String(row.alamat_outlet),
				jarak_dari_pusat_kota: Number(row.jarak_dari_pusat_kota),
				kontak_penyelia: String(row.kontak_penyelia)
			}))
		};
	} catch (err) {
		console.error('Error loading data pelaku usaha:', err);
		return { pelakuUsahaList: [] };
	}
};

export const actions = {
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id_daftar = formData.get('id_daftar')?.toString().trim();

		if (!id_daftar) {
			return fail(400, { error: 'ID Daftar tidak valid untuk dihapus.' });
		}

		try {
			// Hapus pelaku_usaha (tabel terkait permohonan_audit/penugasan/keuangan terhapus via CASCADE / RESTRICT tergantung skema)
			await sql.begin(async (tx) => {
				// Hapus relasi permohonan audit & transaksi pendukung jika ada
				const permohonan = await tx`
					SELECT id_permohonan FROM permohonan_audit WHERE id_daftar = ${id_daftar}
				`;

				if (permohonan.length > 0) {
					const idPermohonan = permohonan[0].id_permohonan;
					await tx`DELETE FROM keuangan_audit WHERE id_permohonan = ${idPermohonan}`;
					await tx`DELETE FROM penugasan WHERE id_permohonan = ${idPermohonan}`;
					await tx`DELETE FROM permohonan_audit WHERE id_permohonan = ${idPermohonan}`;
				}

				await tx`DELETE FROM pelaku_usaha WHERE id_daftar = ${id_daftar}`;
			});

			return { success: true, message: `Pelaku usaha ${id_daftar} berhasil dihapus!` };
		} catch (err) {
			console.error('Error deleting pelaku usaha:', err);
			return fail(500, {
				error:
					'Gagal menghapus data pelaku usaha. Pastikan tidak ada dependensi data lain yang terkunci.'
			});
		}
	}
} satisfies Actions;
