import type { PageServerLoad } from './$types';
import { sql } from '#lib/server/db.ts';

interface LogArsipRow {
	id_arsip: number;
	nama_tabel: string;
	aksi: string;
	nama_user: string | null;
	snapshot_data: Record<string, unknown>;
	timestamp_kejadian: Date | string;
}

export const load: PageServerLoad = async ({ parent }) => {
	await parent();

	try {
		const logs = await sql<LogArsipRow[]>`
      SELECT
        lah.id_arsip,
        lah.nama_tabel,
        lah.aksi,
        u.nama_lengkap AS nama_user,
        lah.snapshot_data,
        lah.timestamp_kejadian
      FROM log_arsip_historis lah
      LEFT JOIN users u ON lah.id_user = u.id_user
      ORDER BY lah.timestamp_kejadian DESC
      LIMIT 100
    `;

		return {
			logs: logs.map((log) => ({
				id_arsip: Number(log.id_arsip),
				nama_tabel: String(log.nama_tabel),
				aksi: String(log.aksi),
				nama_user: log.nama_user ? String(log.nama_user) : 'Sistem / Guest',
				snapshot_data: JSON.stringify(log.snapshot_data, null, 2),
				timestamp: new Date(log.timestamp_kejadian).toLocaleString('id-ID')
			}))
		};
	} catch (err) {
		console.error('Error load log arsip:', err);
		return { logs: [] };
	}
};
