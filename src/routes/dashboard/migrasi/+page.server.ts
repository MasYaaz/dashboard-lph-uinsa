import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sql } from '#lib/server/db.ts';

export const load: PageServerLoad = async ({ parent }) => {
	await parent();
	return {};
};

export const actions = {
	uploadExcel: async ({ request, locals }) => {
		const formData = await request.formData();
		const excelFile = formData.get('excel_file') as File | null;

		if (!excelFile || excelFile.size === 0) {
			return fail(400, { error: 'Pilih berkas Excel (.xlsx / .csv) yang valid untuk diunggah.' });
		}

		const currentUserId = locals.user?.id_user || null;

		try {
			// Data simulasi batch hasil parsing spreadsheet
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
					// Rincian komponen biaya audit sesuai jenis_transaksi_enum
					komponen_biaya: [
						{ jenis: 'TRANSPORT_TALANGAN', jumlah: 200000 },
						{ jenis: 'UH_PENGINAPAN', jumlah: 500000 },
						{ jenis: 'BIAYA_LPH', jumlah: 2000000 },
						{ jenis: 'INPUT_SISTEM', jumlah: 2000000 },
						{ jenis: 'BIAYA_LAIN', jumlah: 300000 }
					],
					nama_auditor_utama: 'Dr. H. Ahmad Fauzi, M.Si',
					nama_auditor_anggota: 'Siti Aminah, S.TP',
					nama_dewan_syariah: 'KH. Abdullah Faqih'
				}
			];

			let successCount = 0;

			for (const row of sampleBatchData) {
				// 1. Cek duplikasi ID Daftar
				const existing = await sql`
					SELECT id_daftar FROM pelaku_usaha WHERE id_daftar = ${row.id_daftar} LIMIT 1
				`;

				if (existing.length > 0) {
					console.warn(
						`[SKIP] ID Daftar ${row.id_daftar} pada baris ${row.baris} sudah ada di database.`
					);
					continue;
				}

				// Transaction 4-In-1: Pelaku Usaha -> Permohonan -> Multi-Item Keuangan -> Penugasan Tim
				await sql.begin(async (tx) => {
					// A. Insert Pelaku Usaha
					await tx`
						INSERT INTO pelaku_usaha (
							id_daftar,
							nama_pelaku_usaha,
							jumlah_produk,
							jumlah_outlet,
							alamat_outlet,
							jarak_dari_pusat_kota,
							nama_kontak_penyelia,
							created_by
						) VALUES (
							${row.id_daftar},
							${row.nama_pelaku_usaha},
							${row.jumlah_produk},
							${row.jumlah_outlet},
							${row.alamat_outlet},
							${row.jarak_dari_pusat_kota},
							${row.nama_kontak_penyelia},
							${currentUserId}
						)
					`;

					// B. Insert Permohonan Audit
					const resPermohonan = await tx`
						INSERT INTO permohonan_audit (id_daftar)
						VALUES (${row.id_daftar})
						RETURNING id_permohonan
					`;
					const idPermohonan = resPermohonan[0].id_permohonan;

					// C. Insert Multi-Item Komponen Biaya Keuangan Audit
					for (const item of row.komponen_biaya) {
						await tx`
							INSERT INTO keuangan_audit (
								id_permohonan,
								no_invoice,
								jenis_transaksi,
								jumlah_uang,
								status_keuangan,
								created_by
							) VALUES (
								${idPermohonan},
								${row.no_invoice},
								${item.jenis}::jenis_transaksi_enum,
								${item.jumlah},
								'SIAP_VERIFIKASI'::status_keuangan_enum,
								${currentUserId}
							)
						`;
					}

					// D. Look up Petugas Field & Insert Penugasan Tim
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
							const pet = await tx`
								SELECT id_petugas FROM petugas_field WHERE nama_petugas ILIKE ${row.nama_auditor_utama} LIMIT 1
							`;
							if (pet.length > 0) {
								await tx`
									INSERT INTO detail_penugasan_petugas (id_penugasan, id_petugas)
									VALUES (${idPenugasan}, ${pet[0].id_petugas})
								`;
							}
						}

						// Mapping Auditor Anggota
						if (row.nama_auditor_anggota) {
							const pet = await tx`
								SELECT id_petugas FROM petugas_field WHERE nama_petugas ILIKE ${row.nama_auditor_anggota} LIMIT 1
							`;
							if (pet.length > 0) {
								await tx`
									INSERT INTO detail_penugasan_petugas (id_penugasan, id_petugas)
									VALUES (${idPenugasan}, ${pet[0].id_petugas})
								`;
							}
						}

						// Mapping Dewan Syariah
						if (row.nama_dewan_syariah) {
							const pet = await tx`
								SELECT id_petugas FROM petugas_field WHERE nama_petugas ILIKE ${row.nama_dewan_syariah} LIMIT 1
							`;
							if (pet.length > 0) {
								await tx`
									INSERT INTO detail_penugasan_petugas (id_penugasan, id_petugas)
									VALUES (${idPenugasan}, ${pet[0].id_petugas})
								`;
							}
						}
					}
				});

				successCount++;
			}

			return {
				success: true,
				message: `Migrasi 4-in-1 selesai: ${successCount} data lengkap (Pelaku Usaha, Permohonan, Rincian Keuangan, & Tim Petugas) berhasil diimpor!`
			};
		} catch (err) {
			console.error('Error processing batch import:', err);
			return fail(500, { error: 'Gagal memproses migrasi data Excel.' });
		}
	}
} satisfies Actions;
