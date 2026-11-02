import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sql } from '#lib/server/db.ts';

interface DashboardStatsRow {
	total_pu: number;
	menunggu_verifikasi: number;
	terverifikasi: number;
	perlu_revisi: number;
}

interface PelakuUsahaRekapRow {
	id_daftar: string;
	nama_pelaku_usaha: string;
	tim_auditor: string | null;
	total_biaya_final: number | null;
	status_penugasan: string | null;
	status_keuangan: string | null;
}

export const load: PageServerLoad = async ({ parent, url }) => {
	const { user } = await parent();

	const search = url.searchParams.get('q') || '';
	const statusFilter = url.searchParams.get('status') || '';

	try {
		// 1. Query Statistik Ringkasan dari Tabel PostgreSQL Terbaru
		const statsRes = await sql<DashboardStatsRow[]>`
			SELECT
				COUNT(pu.id_daftar)::int AS total_pu,
				COUNT(CASE WHEN p.id_penugasan IS NULL OR p.status_penugasan = 'PENDING' THEN 1 END)::int AS menunggu_verifikasi,
				COUNT(CASE WHEN p.status_penugasan = 'ASSIGNED' AND ka.status_keuangan = 'DITERIMA' THEN 1 END)::int AS terverifikasi,
				COUNT(CASE WHEN ka.status_keuangan = 'REVISI' THEN 1 END)::int AS perlu_revisi
			FROM pelaku_usaha pu
			LEFT JOIN permohonan_audit pa ON pu.id_daftar = pa.id_daftar
			LEFT JOIN penugasan p ON pa.id_permohonan = p.id_permohonan
			LEFT JOIN keuangan_audit ka ON pa.id_permohonan = ka.id_permohonan
		`;

		const stats = statsRes[0] || {
			total_pu: 0,
			menunggu_verifikasi: 0,
			terverifikasi: 0,
			perlu_revisi: 0
		};

		// 2. Query Rekap Daftar Pelaku Usaha & Status
		const querySearch = `%${search}%`;

		const dataList = await sql<PelakuUsahaRekapRow[]>`
			SELECT
				pu.id_daftar,
				pu.nama_pelaku_usaha,
				(
					SELECT STRING_AGG(pf.nama_petugas, ', ')
					FROM detail_penugasan_petugas dp
					JOIN petugas_field pf ON dp.id_petugas = pf.id_petugas
					JOIN penugasan p_sub ON dp.id_penugasan = p_sub.id_penugasan
					WHERE p_sub.id_permohonan = pa.id_permohonan
				) AS tim_auditor,
				ka.total_biaya_final,
				p.status_penugasan,
				ka.status_keuangan
			FROM pelaku_usaha pu
			JOIN permohonan_audit pa ON pu.id_daftar = pa.id_daftar
			LEFT JOIN penugasan p ON pa.id_permohonan = p.id_permohonan
			LEFT JOIN keuangan_audit ka ON pa.id_permohonan = ka.id_permohonan
			WHERE
				(pu.id_daftar ILIKE ${querySearch} OR pu.nama_pelaku_usaha ILIKE ${querySearch})
				${
					statusFilter === 'PENDING'
						? sql`AND (p.status_penugasan IS NULL OR p.status_penugasan = 'PENDING')`
						: statusFilter === 'TERVERIFIKASI'
							? sql`AND (p.status_penugasan = 'ASSIGNED' AND ka.status_keuangan = 'DITERIMA')`
							: statusFilter === 'REVISI'
								? sql`AND (ka.status_keuangan = 'REVISI')`
								: sql``
				}
			ORDER BY pa.tanggal_permohonan DESC
		`;

		return {
			userRole: user.role,
			stats: {
				totalPu: stats.total_pu,
				menungguVerifikasi: stats.menunggu_verifikasi,
				terverifikasi: stats.terverifikasi,
				perluRevisi: stats.perlu_revisi
			},
			pelakuUsahaList: dataList.map((row) => {
				// Determinasi kalkulasi tampilan status ringkasan UI
				let displayStatus = 'PENDING';
				if (row.status_keuangan === 'REVISI') {
					displayStatus = 'REVISI';
				} else if (row.status_penugasan === 'ASSIGNED' && row.status_keuangan === 'DITERIMA') {
					displayStatus = 'TERVERIFIKASI';
				}

				return {
					idDaftar: String(row.id_daftar),
					namaPu: String(row.nama_pelaku_usaha),
					timAuditor: row.tim_auditor ? String(row.tim_auditor) : 'Belum ditugaskan',
					totalBiaya: row.total_biaya_final ? Number(row.total_biaya_final) : null,
					status: displayStatus
				};
			})
		};
	} catch (err) {
		console.error('Error loading dashboard rekap data:', err);
		return {
			userRole: user.role,
			stats: { totalPu: 0, menungguVerifikasi: 0, terverifikasi: 0, perluRevisi: 0 },
			pelakuUsahaList: []
		};
	}
};

export const actions = {
	exportExcel: async ({ locals }) => {
		const userRole = locals.user?.role || 'ADMINISTRASI';

		try {
			let csvHeaders: string[] = [];
			let rows: string[][] = [];

			if (userRole === 'BENDAHARA') {
				// EKSPOR KHUSUS BENDAHARA (Tabel `keuangan_audit` & `permohonan_audit`)
				csvHeaders = [
					'ID Daftar',
					'Nama Pelaku Usaha',
					'No Invoice',
					'Biaya Transport Talangan',
					'Biaya UH & Penginapan',
					'Total Biaya LPH',
					'Biaya Input Sistem',
					'Biaya Tambahan',
					'Total Biaya Final',
					'Status Keuangan'
				];

				const data = await sql`
					SELECT
						pu.id_daftar,
						pu.nama_pelaku_usaha,
						COALESCE(ka.no_invoice, '-') AS no_invoice,
						COALESCE(ka.biaya_transport_talangan, 0) AS biaya_transport_talangan,
						COALESCE(ka.biaya_uh_penginapan, 0) AS biaya_uh_penginapan,
						COALESCE(ka.total_biaya_lph, 0) AS total_biaya_lph,
						COALESCE(ka.biaya_input_sistem, 0) AS biaya_input_sistem,
						COALESCE(ka.biaya_tambahan, 0) AS biaya_tambahan,
						COALESCE(ka.total_biaya_final, 0) AS total_biaya_final,
						COALESCE(ka.status_keuangan::text, 'DRAFT') AS status_keuangan
					FROM pelaku_usaha pu
					JOIN permohonan_audit pa ON pu.id_daftar = pa.id_daftar
					LEFT JOIN keuangan_audit ka ON pa.id_permohonan = ka.id_permohonan
					ORDER BY pa.tanggal_permohonan DESC
				`;

				rows = data.map((r) => [
					`"${r.id_daftar}"`,
					`"${r.nama_pelaku_usaha}"`,
					`"${r.no_invoice}"`,
					`"${r.biaya_transport_talangan}"`,
					`"${r.biaya_uh_penginapan}"`,
					`"${r.total_biaya_lph}"`,
					`"${r.biaya_input_sistem}"`,
					`"${r.biaya_tambahan}"`,
					`"${r.total_biaya_final}"`,
					`"${r.status_keuangan}"`
				]);
			} else {
				// EKSPOR KHUSUS STAF ADMINISTRASI (Tabel `pelaku_usaha`, `penugasan`, & `petugas_field`)
				csvHeaders = [
					'ID Daftar',
					'Nama Pelaku Usaha',
					'Jumlah Produk',
					'Jumlah Outlet',
					'Alamat Outlet',
					'Jarak dari Pusat Kota (km)',
					'Nama Kontak Penyelia',
					'Kebutuhan Auditor',
					'Tim Petugas Field Assigned',
					'Status Penugasan'
				];

				const data = await sql`
					SELECT
						pu.id_daftar,
						pu.nama_pelaku_usaha,
						pu.jumlah_produk,
						pu.jumlah_outlet,
						pu.alamat_outlet,
						pu.jarak_dari_pusat_kota,
						pu.nama_kontak_penyelia,
						COALESCE(p.kebutuhan_jumlah_auditor, 0) AS kebutuhan_auditor,
						(
							SELECT STRING_AGG(pf.nama_petugas || ' (' || pf.peran || ')', '; ')
							FROM detail_penugasan_petugas dp
							JOIN petugas_field pf ON dp.id_petugas = pf.id_petugas
							WHERE dp.id_penugasan = p.id_penugasan
						) AS tim_petugas,
						COALESCE(p.status_penugasan::text, 'PENDING') AS status_penugasan
					FROM pelaku_usaha pu
					JOIN permohonan_audit pa ON pu.id_daftar = pa.id_daftar
					LEFT JOIN penugasan p ON pa.id_permohonan = p.id_permohonan
					ORDER BY pa.tanggal_permohonan DESC
				`;

				rows = data.map((r) => [
					`"${r.id_daftar}"`,
					`"${r.nama_pelaku_usaha}"`,
					`"${r.jumlah_produk}"`,
					`"${r.jumlah_outlet}"`,
					`"${r.alamat_outlet.replace(/"/g, '""')}"`,
					`"${r.jarak_dari_pusat_kota}"`,
					`"${r.nama_kontak_penyelia}"`,
					`"${r.kebutuhan_auditor}"`,
					`"${r.tim_petugas || 'Belum Ditugaskan'}"`,
					`"${r.status_penugasan}"`
				]);
			}

			const csvContent = `${csvHeaders.join(',')}\n${rows.map((e) => e.join(',')).join('\n')}`;

			return {
				success: true,
				fileName: `Laporan_SIM_LPH_${userRole}_${new Date().toISOString().slice(0, 10)}.csv`,
				fileData: csvContent
			};
		} catch (err) {
			console.error('Error generate CSV export:', err);
			return fail(500, { error: 'Gagal membuat file laporan ekspor.' });
		}
	}
} satisfies Actions;
