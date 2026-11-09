import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sql } from '#lib/server/db.ts';

export interface PetugasRef {
	id_petugas: number;
	nama_petugas: string;
	peran: string;
}

export interface PermohonanRef {
	id_permohonan: number;
	id_daftar: string;
	nama_pelaku_usaha: string;
}

export const load: PageServerLoad = async ({ parent }) => {
	await parent();

	try {
		const daftarPetugasRaw = await sql`
			SELECT id_petugas, nama_petugas, peran
			FROM petugas_field
			ORDER BY nama_petugas ASC
		`;

		const daftarPermohonanRaw = await sql`
			SELECT pa.id_permohonan, pa.id_daftar, pu.nama_pelaku_usaha
			FROM permohonan_audit pa
			JOIN pelaku_usaha pu ON pa.id_daftar = pu.id_daftar
			ORDER BY pa.id_permohonan DESC
		`;

		const daftarPetugas: PetugasRef[] = daftarPetugasRaw.map((row) => ({
			id_petugas: Number(row.id_petugas),
			nama_petugas: String(row.nama_petugas),
			peran: String(row.peran)
		}));

		const daftarPermohonan: PermohonanRef[] = daftarPermohonanRaw.map((row) => ({
			id_permohonan: Number(row.id_permohonan),
			id_daftar: String(row.id_daftar),
			nama_pelaku_usaha: String(row.nama_pelaku_usaha)
		}));

		return {
			referensi: {
				petugas: daftarPetugas,
				permohonan: daftarPermohonan
			}
		};
	} catch (err) {
		console.error('Error loading lookup references for migration:', err);
		return { referensi: { petugas: [], permohonan: [] } };
	}
};

function parseCSVLine(line: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];

		if (char === '"') {
			if (inQuotes && line[i + 1] === '"') {
				current += '"';
				i++;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (char === ',' && !inQuotes) {
			result.push(current.trim());
			current = '';
		} else {
			current += char;
		}
	}
	result.push(current.trim());
	return result;
}

export const actions = {
	previewFile: async ({ request }) => {
		const formData = await request.formData();
		const targetTable = formData.get('target_table')?.toString().trim();
		const files = formData.getAll('excel_file') as File[];

		if (!targetTable || files.length === 0 || files[0].size === 0) {
			return fail(400, { error: 'Pilih jenis tabel target dan unggah berkas CSV yang valid.' });
		}

		try {
			const file = files[0];
			const textContent = await file.text();
			const lines = textContent.split(/\r?\n/).filter((line) => line.trim().length > 0);

			if (lines.length < 2) {
				return fail(400, { error: 'Berkas CSV minimal harus memiliki header dan 1 baris data.' });
			}

			const headers = parseCSVLine(lines[0]);
			const rows = lines.slice(1).map((line, idx) => {
				const values = parseCSVLine(line);
				const rowObj: Record<string, string> = { _row_idx: String(idx + 2) };
				headers.forEach((header, colIdx) => {
					rowObj[header] = values[colIdx] ?? '';
				});
				return rowObj;
			});

			return {
				previewSuccess: true,
				targetTable,
				fileName: file.name,
				headers,
				rows
			};
		} catch (err) {
			console.error('Error parsing csv preview:', err);
			return fail(500, { error: 'Gagal membaca berkas CSV.' });
		}
	},

	executeImport: async ({ request, locals }) => {
		const formData = await request.formData();
		const targetTable = formData.get('target_table')?.toString().trim();
		const payloadJson = formData.get('payload_json')?.toString().trim();

		if (!targetTable || !payloadJson) {
			return fail(400, { error: 'Data impor tidak ditemukan atau sudah kadaluarsa.' });
		}

		let rows: Record<string, string>[];
		try {
			rows = JSON.parse(payloadJson);
		} catch {
			return fail(400, { error: 'Format payload data tidak valid.' });
		}

		const currentUserId = locals.user?.id_user || null;
		let successCount = 0;
		let failCount = 0;

		try {
			await sql.begin(async (tx) => {
				for (const row of rows) {
					try {
						if (targetTable === 'pelaku_usaha') {
							await tx`
								INSERT INTO pelaku_usaha (
									id_daftar, nama_pelaku_usaha, jumlah_produk, jumlah_outlet,
									alamat_outlet, jarak_dari_pusat_kota, kontak_penyelia, created_by
								) VALUES (
									${row.id_daftar}, ${row.nama_pelaku_usaha}, ${parseInt(row.jumlah_produk || '0')},
									${parseInt(row.jumlah_outlet || '0')}, ${row.alamat_outlet},
									${parseFloat(row.jarak_dari_pusat_kota || '0')}, ${row.kontak_penyelia}, ${currentUserId}
								)
								ON CONFLICT (id_daftar) DO UPDATE SET
									nama_pelaku_usaha = EXCLUDED.nama_pelaku_usaha,
									jumlah_produk = EXCLUDED.jumlah_produk,
									jumlah_outlet = EXCLUDED.jumlah_outlet,
									alamat_outlet = EXCLUDED.alamat_outlet,
									jarak_dari_pusat_kota = EXCLUDED.jarak_dari_pusat_kota,
									kontak_penyelia = EXCLUDED.kontak_penyelia;
							`;
						} else if (targetTable === 'permohonan_audit') {
							await tx`
								INSERT INTO permohonan_audit (id_daftar, tanggal_permohonan)
								VALUES (${row.id_daftar}, ${row.tanggal_permohonan || new Date().toISOString().split('T')[0]})
							`;
						} else if (targetTable === 'penugasan') {
							await tx`
								INSERT INTO penugasan (id_permohonan, kebutuhan_jumlah_auditor, status_penugasan, assigned_by)
								VALUES (
									${parseInt(row.id_permohonan)}, ${parseInt(row.kebutuhan_jumlah_auditor || '1')},
									${row.status_penugasan || 'ASSIGNED'}::status_penugasan_enum, ${currentUserId}
								)
							`;
						} else if (targetTable === 'detail_penugasan_petugas') {
							const regId = (row.id_daftar || row.id_penugasan || row.id_permohonan || '').trim();
							let targetPenugasanId = parseInt(regId || '0');

							if (isNaN(targetPenugasanId) || targetPenugasanId === 0) {
								const resPen = await tx`
									SELECT p.id_penugasan
									FROM penugasan p
									JOIN permohonan_audit pa ON p.id_permohonan = pa.id_permohonan
									WHERE pa.id_daftar = ${regId}
									ORDER BY p.id_penugasan DESC
									LIMIT 1
								`;
								if (resPen.length > 0) {
									targetPenugasanId = Number(resPen[0].id_penugasan);
								}
							}

							if (!targetPenugasanId || isNaN(targetPenugasanId)) {
								throw new Error(
									`Data Penugasan untuk No Registrasi "${regId || 'kosong'}" belum ada di database. Pastikan Step 3 (penugasan) sudah diimpor.`
								);
							}

							const idPetugasNum = parseInt(row.id_petugas || '0');
							if (!idPetugasNum) {
								throw new Error(`ID Petugas tidak valid pada baris #${row._row_idx}.`);
							}

							await tx`
								INSERT INTO detail_penugasan_petugas (id_penugasan, id_petugas)
								VALUES (${targetPenugasanId}, ${idPetugasNum})
							`;
						} else if (targetTable === 'keuangan_audit') {
							// STEP 5 REFACTOR: Impor Keuangan Audit ke Header (`keuangan_audit`) & Detail (`detail_keuangan_audit`)
							let targetPermohonanId = parseInt(row.id_permohonan || '0');

							if (!targetPermohonanId && row.id_daftar) {
								const resPerm = await tx`
									SELECT id_permohonan FROM permohonan_audit WHERE id_daftar = ${row.id_daftar} LIMIT 1
								`;
								if (resPerm.length > 0) {
									targetPermohonanId = Number(resPerm[0].id_permohonan);
								}
							}

							if (!targetPermohonanId || isNaN(targetPermohonanId)) {
								throw new Error(
									`Permohonan Audit untuk "${row.id_daftar || row.id_permohonan}" tidak ditemukan di database.`
								);
							}

							const nominalUang = parseFloat(row.jumlah_uang || '0');

							// 1. Insert / Upsert Header Invoice
							const resHeader = await tx`
								INSERT INTO keuangan_audit (
									id_permohonan, no_invoice, total_tagihan, status_keuangan, created_by
								) VALUES (
									${targetPermohonanId}, ${row.no_invoice}, ${nominalUang},
									${row.status_keuangan || 'SIAP_VERIFIKASI'}::status_keuangan_enum, ${currentUserId}
								)
								ON CONFLICT (no_invoice) DO UPDATE SET
									total_tagihan = keuangan_audit.total_tagihan + EXCLUDED.total_tagihan,
									updated_at = CURRENT_TIMESTAMP
								RETURNING id_keuangan;
							`;

							const idKeuangan = Number(resHeader[0].id_keuangan);
							const keteranganFinal = row.catatan_revisi || row.keterangan || null;

							// 2. Insert Item Rincian Biaya ke Detail
							await tx`
								INSERT INTO detail_keuangan_audit (
									id_keuangan, jenis_transaksi, jumlah_uang, keterangan
								) VALUES (
									${idKeuangan}, ${row.jenis_transaksi}::jenis_transaksi_enum, ${nominalUang}, ${keteranganFinal}
								);
							`;
						}
						successCount++;
					} catch (rowErr) {
						console.error(`Error import row #${row._row_idx} pada tabel ${targetTable}:`, rowErr);
						failCount++;
					}
				}
			});

			return {
				success: true,
				importedTable: targetTable,
				message: `Impor data "${targetTable}" berhasil! ${successCount} data tersimpan di database${failCount > 0 ? `, ${failCount} gagal.` : '.'}`
			};
		} catch (err) {
			console.error('Error execute import single table:', err);
			return fail(500, { error: `Gagal mengeksekusi impor data ${targetTable} ke database.` });
		}
	}
} satisfies Actions;
