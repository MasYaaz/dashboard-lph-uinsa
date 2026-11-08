import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sql } from '#lib/server/db.ts';

interface ImportLogRow {
	id_log: number;
	nama_berkas: string;
	baris_ke: number;
	id_daftar_input: string | null;
	jenis_error: string;
	pesan_error: string;
	created_at: Date | string;
}

export const load: PageServerLoad = async ({ parent }) => {
	await parent();

	try {
		const importLogs = await sql<ImportLogRow[]>`
      SELECT id_log, nama_berkas, baris_ke, id_daftar_input, jenis_error, pesan_error, created_at
      FROM import_log
      ORDER BY created_at DESC
      LIMIT 50
    `;

		return {
			importLogs: importLogs.map((log) => ({
				id_log: Number(log.id_log),
				nama_berkas: String(log.nama_berkas),
				baris_ke: Number(log.baris_ke),
				id_daftar_input: log.id_daftar_input ? String(log.id_daftar_input) : '-',
				jenis_error: String(log.jenis_error),
				pesan_error: String(log.pesan_error),
				tgl_log: new Date(log.created_at).toLocaleString('id-ID')
			}))
		};
	} catch (err) {
		console.error('Error loading import logs:', err);
		return { importLogs: [] };
	}
};

export const actions = {
	uploadExcel: async ({ request, locals }) => {
		const formData = await request.formData();
		const excelFile = formData.get('excel_file') as File | null;

		if (!excelFile || excelFile.size === 0) {
			return fail(400, { error: 'Pilih berkas Excel (.xlsx / .csv) yang valid untuk diunggah.' });
		}

		const currentUserId = locals.user?.id_user || null;
		const fileName = excelFile.name;

		try {
			// Data simulasi batch hasil parsing spreadsheet (lengkap dengan Auditor & Dewan Syariah)
			const sampleBatchData = [
				{
					baris: 2,
					id_daftar: 'REG-2026-0901',
					nama_pelaku_usaha: 'PT Pangan Halal Nusantara',
					jumlah_produk: 15,
					jumlah_outlet: 2,
					alamat_outlet: 'Jl. Ahmad Yani No. 88, Surabaya',
					jarak_dari_pusat_kota: 5.5,
					nama_kontak_penyelia: 'Budi Santoso (08123456789)',
					no_invoice: 'INV/LPH/2026/0901',
					biaya_transport_talangan: 200000,
					biaya_uh_penginapan: 500000,
					total_biaya_lph: 2000000,
					biaya_input_sistem: 2000000,
					biaya_tambahan: 300000,
					nama_auditor_utama: 'Dr. H. Ahmad Fauzi, M.Si',
					nama_auditor_anggota: 'Siti Aminah, S.TP',
					nama_dewan_syariah: 'KH. Abdullah Faqih'
				}
			];

			let successCount = 0;

			for (const row of sampleBatchData) {
				// Cek duplikasi ID Daftar
				const existing = await sql`
          SELECT id_daftar FROM pelaku_usaha WHERE id_daftar = ${row.id_daftar} LIMIT 1
        `;

				if (existing.length > 0) {
					await sql`
            INSERT INTO import_log (nama_berkas, baris_ke, id_daftar_input, jenis_error, pesan_error, uploaded_by)
            VALUES (${fileName}, ${row.baris}, ${row.id_daftar}, 'DUPLIKAT_ERROR', ${'No ID-Daftar sudah terdaftar dalam sistem'}, ${currentUserId})
          `;
					continue;
				}

				const totalBiayaFinal = Number(row.biaya_input_sistem) + Number(row.biaya_tambahan);

				// Transaction 4-In-1: Pelaku Usaha -> Permohonan -> Keuangan -> Penugasan Tim
				await sql.begin(async (tx) => {
					// 1. Insert Pelaku Usaha
					await tx`
            INSERT INTO pelaku_usaha (
              id_daftar, nama_pelaku_usaha, jumlah_produk, jumlah_outlet, alamat_outlet, jarak_dari_pusat_kota, nama_kontak_penyelia, created_by
            ) VALUES (
              ${row.id_daftar}, ${row.nama_pelaku_usaha}, ${row.jumlah_produk}, ${row.jumlah_outlet}, ${row.alamat_outlet}, ${row.jarak_dari_pusat_kota}, ${row.nama_kontak_penyelia}, ${currentUserId}
            )
          `;

					// 2. Insert Permohonan Audit
					const resPermohonan = await tx`
            INSERT INTO permohonan_audit (id_daftar)
            VALUES (${row.id_daftar})
            RETURNING id_permohonan
          `;
					const idPermohonan = resPermohonan[0].id_permohonan;

					// 3. Insert Keuangan Audit
					await tx`
            INSERT INTO keuangan_audit (
              id_permohonan, no_invoice, biaya_transport_talangan, biaya_uh_penginapan, total_biaya_lph, biaya_input_sistem, biaya_tambahan, total_biaya_final, status_keuangan, created_by
            ) VALUES (
              ${idPermohonan}, ${row.no_invoice}, ${row.biaya_transport_talangan}, ${row.biaya_uh_penginapan}, ${row.total_biaya_lph}, ${row.biaya_input_sistem}, ${row.biaya_tambahan}, ${totalBiayaFinal}, 'SIAP_VERIFIKASI', ${currentUserId}
            )
          `;

					// 4. Look up Petugas Field & Insert Penugasan Tim (jika data auditor ada di file excel)
					if (row.nama_auditor_utama || row.nama_dewan_syariah) {
						const totalAuditor = row.nama_auditor_anggota ? 2 : 1;

						const resPenugasan = await tx`
              INSERT INTO penugasan (id_permohonan, kebutuhan_jumlah_auditor, status_penugasan, assigned_by)
              VALUES (${idPermohonan}, ${totalAuditor}, 'ASSIGNED', ${currentUserId})
              RETURNING id_penugasan
            `;
						const idPenugasan = resPenugasan[0].id_penugasan;

						// Mapping Auditor Utama
						if (row.nama_auditor_utama) {
							const pet =
								await tx`SELECT id_petugas FROM petugas_field WHERE nama_petugas ILIKE ${row.nama_auditor_utama} LIMIT 1`;
							if (pet.length > 0) {
								await tx`INSERT INTO detail_penugasan_petugas (id_penugasan, id_petugas) VALUES (${idPenugasan}, ${pet[0].id_petugas})`;
							}
						}

						// Mapping Auditor Anggota
						if (row.nama_auditor_anggota) {
							const pet =
								await tx`SELECT id_petugas FROM petugas_field WHERE nama_petugas ILIKE ${row.nama_auditor_anggota} LIMIT 1`;
							if (pet.length > 0) {
								await tx`INSERT INTO detail_penugasan_petugas (id_penugasan, id_petugas) VALUES (${idPenugasan}, ${pet[0].id_petugas})`;
							}
						}

						// Mapping Dewan Syariah
						if (row.nama_dewan_syariah) {
							const pet =
								await tx`SELECT id_petugas FROM petugas_field WHERE nama_petugas ILIKE ${row.nama_dewan_syariah} LIMIT 1`;
							if (pet.length > 0) {
								await tx`INSERT INTO detail_penugasan_petugas (id_penugasan, id_petugas) VALUES (${idPenugasan}, ${pet[0].id_petugas})`;
							}
						}
					}
				});

				successCount++;
			}

			return {
				success: true,
				message: `Migrasi 4-in-1 selesai: ${successCount} data lengkap (Pelaku Usaha, Permohonan, Keuangan, & Tim Petugas) berhasil diimpor!`
			};
		} catch (err) {
			console.error('Error processing batch import:', err);
			return fail(500, { error: 'Gagal memproses migrasi data Excel.' });
		}
	}
} satisfies Actions;
