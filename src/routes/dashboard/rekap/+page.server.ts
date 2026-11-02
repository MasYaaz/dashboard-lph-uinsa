import type { PageServerLoad } from './$types';
import { sql } from '#lib/server/db.ts';

interface RekapMasterRow {
	id_daftar: string;
	nama_pelaku_usaha: string;
	jumlah_produk: number;
	jumlah_outlet: number;
	status_penugasan: string | null;
	status_keuangan: string | null;
	total_biaya_final: number | null;
	tim_petugas: string | null;
	tanggal_permohonan: Date | string;
}

export const load: PageServerLoad = async ({ parent }) => {
	await parent();

	try {
		const rekapData = await sql<RekapMasterRow[]>`
      SELECT
        pu.id_daftar,
        pu.nama_pelaku_usaha,
        pu.jumlah_produk,
        pu.jumlah_outlet,
        pa.tanggal_permohonan,
        p.status_penugasan,
        ka.status_keuangan,
        ka.total_biaya_final,
        (
          SELECT STRING_AGG(pf.nama_petugas || ' (' || pf.peran || ')', ', ')
          FROM detail_penugasan_petugas dp
          JOIN petugas_field pf ON dp.id_petugas = pf.id_petugas
          WHERE dp.id_penugasan = p.id_penugasan
        ) AS tim_petugas
      FROM pelaku_usaha pu
      JOIN permohonan_audit pa ON pu.id_daftar = pa.id_daftar
      LEFT JOIN penugasan p ON pa.id_permohonan = p.id_permohonan
      LEFT JOIN keuangan_audit ka ON pa.id_permohonan = ka.id_permohonan
      ORDER BY pa.tanggal_permohonan DESC
    `;

		return {
			rekapList: rekapData.map((row) => ({
				id_daftar: String(row.id_daftar),
				nama_pu: String(row.nama_pelaku_usaha),
				jumlah_produk: Number(row.jumlah_produk),
				jumlah_outlet: Number(row.jumlah_outlet),
				tgl_masuk: new Date(row.tanggal_permohonan).toLocaleDateString('id-ID'),
				status_penugasan: row.status_penugasan ? String(row.status_penugasan) : 'BELUM PLOTTING',
				status_keuangan: row.status_keuangan ? String(row.status_keuangan) : 'BELUM DITAGIH',
				total_biaya: row.total_biaya_final ? Number(row.total_biaya_final) : 0,
				tim_petugas: row.tim_petugas ? String(row.tim_petugas) : '-'
			}))
		};
	} catch (err) {
		console.error('Error load rekap data:', err);
		return { rekapList: [] };
	}
};
