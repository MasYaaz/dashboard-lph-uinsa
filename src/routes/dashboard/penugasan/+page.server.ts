import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sql } from '#lib/server/db.ts';

export interface RiwayatPenugasanItem {
	id_penugasan: number;
	id_daftar: string;
	nama_pu: string;
	tgl_penugasan: string;
	status_penugasan: string;
	tim_petugas: string;
}

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	if (user.role !== 'ADMINISTRASI') {
		throw redirect(303, '/dashboard');
	}

	try {
		// Ambil riwayat penugasan tim
		const riwayatPenugasanRaw = await sql`
			SELECT
				p.id_penugasan,
				pa.id_daftar,
				pu.nama_pelaku_usaha AS nama_pu,
				p.created_at AS tgl_penugasan,
				p.status_penugasan,
				(
					SELECT STRING_AGG(pf.nama_petugas || ' (' || pf.peran || ')', ', ')
					FROM detail_penugasan_petugas dp
					JOIN petugas_field pf ON dp.id_petugas = pf.id_petugas
					WHERE dp.id_penugasan = p.id_penugasan
				) AS tim_petugas
			FROM penugasan p
			JOIN permohonan_audit pa ON p.id_permohonan = pa.id_permohonan
			JOIN pelaku_usaha pu ON pa.id_daftar = pu.id_daftar
			ORDER BY p.created_at DESC
		`;

		const riwayatPenugasan: RiwayatPenugasanItem[] = riwayatPenugasanRaw.map((row) => ({
			id_penugasan: Number(row.id_penugasan),
			id_daftar: String(row.id_daftar),
			nama_pu: String(row.nama_pu),
			tgl_penugasan: new Date(row.tgl_penugasan).toLocaleDateString('id-ID', {
				day: 'numeric',
				month: 'short',
				year: 'numeric'
			}),
			status_penugasan: String(row.status_penugasan),
			tim_petugas: String(row.tim_petugas ?? '-')
		}));

		return { riwayatPenugasan };
	} catch (err) {
		console.error('Error load list penugasan:', err);
		return { riwayatPenugasan: [] };
	}
};

export const actions = {
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id_penugasan = formData.get('id_penugasan')?.toString().trim();

		if (!id_penugasan) {
			return fail(400, { error: 'ID Penugasan tidak valid.' });
		}

		try {
			await sql.begin(async (tx) => {
				const idPenugasanInt = parseInt(id_penugasan);

				// 1. Hapus detail alokasi petugas
				await tx`DELETE FROM detail_penugasan_petugas WHERE id_penugasan = ${idPenugasanInt}`;

				// 2. Hapus entri penugasan utama
				await tx`DELETE FROM penugasan WHERE id_penugasan = ${idPenugasanInt}`;
			});

			return { success: true, message: `Penugasan tim #${id_penugasan} berhasil dihapus!` };
		} catch (err) {
			console.error('Error deleting penugasan:', err);
			return fail(500, {
				error: 'Gagal menghapus penugasan tim. Pastikan tidak ada data transaksi yang terkunci.'
			});
		}
	}
} satisfies Actions;
