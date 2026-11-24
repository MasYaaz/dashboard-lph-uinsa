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

		return {
			referensi: {
				petugas: daftarPetugasRaw.map((row) => ({
					id_petugas: Number(row.id_petugas),
					nama_petugas: String(row.nama_petugas),
					peran: String(row.peran)
				})) as PetugasRef[],
				permohonan: daftarPermohonanRaw.map((row) => ({
					id_permohonan: Number(row.id_permohonan),
					id_daftar: String(row.id_daftar),
					nama_pelaku_usaha: String(row.nama_pelaku_usaha)
				})) as PermohonanRef[]
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

function normalizeEnumValue(header: string, rawValue: string): string {
	const clean = rawValue
		.trim()
		.toUpperCase()
		.replace(/[\s\-&/]+/g, '_');

	if (header === 'status_penugasan') {
		if (['PENDING', 'MENUNGGU', 'BELUM'].includes(clean)) return 'PENDING';
		if (['REASSIGNED', 'GANTI', 'ULANG', 'PENUGASAN_ULANG'].includes(clean)) return 'REASSIGNED';
		if (['ASSIGNED', 'DITUGASKAN', 'AKTIF', 'SELESAI'].includes(clean)) return 'ASSIGNED';
		return clean || 'ASSIGNED';
	}

	if (header === 'status_keuangan') {
		if (['DRAFT', 'KONSEP'].includes(clean)) return 'DRAFT';
		if (['DITERIMA', 'LUNAS', 'VERIFIED', 'TERVERIFIKASI', 'SELESAI', 'PAID'].includes(clean))
			return 'DITERIMA';
		if (['REVISI', 'PERBAIKAN', 'DITOLAK', 'REJECTED'].includes(clean)) return 'REVISI';
		if (['SIAP_VERIFIKASI', 'MENUNGGU', 'PENDING', 'DIAJUKAN', 'REVIEW'].includes(clean))
			return 'SIAP_VERIFIKASI';
		return clean || 'SIAP_VERIFIKASI';
	}

	if (header === 'jenis_transaksi') {
		if (clean.includes('TRANSPORT')) return 'TRANSPORT_TALANGAN';
		if (clean.includes('UH') || clean.includes('PENGINAPAN') || clean.includes('HARIAN'))
			return 'UH_PENGINAPAN';
		if (clean.includes('LPH')) return 'BIAYA_LPH';
		if (clean.includes('SISTEM') || clean.includes('INPUT')) return 'INPUT_SISTEM';
		if (clean.includes('TENTATIVE') || clean.includes('LAPANGAN')) return 'TENTATIVE_LAPANGAN';
		if (clean.includes('FINAL') || clean.includes('PAKET')) return 'TAGIHAN_FINAL';
		if (clean.includes('LAIN')) return 'BIAYA_LAIN';
		return clean || 'BIAYA_LAIN';
	}

	return rawValue.trim();
}

export const actions = {
	previewFile: async ({ request }) => {
		const formData = await request.formData();
		const targetTable = formData.get('target_table')?.toString().trim();
		const files = formData.getAll('excel_file') as File[];

		if (!targetTable || files.length === 0 || files[0].size === 0) {
			return fail(400, { error: 'Pilih jenis berkas CSV dan unggah berkas yang valid.' });
		}

		try {
			const file = files[0];
			const textContent = await file.text();
			const lines = textContent.split(/\r?\n/).filter((line) => line.trim().length > 0);

			if (lines.length < 2) {
				return fail(400, { error: 'Berkas CSV minimal harus memiliki header dan 1 baris data.' });
			}

			// Ambil master petugas untuk auto-resolve nama petugas -> ID
			const masterPetugas = await sql`SELECT id_petugas, nama_petugas FROM petugas_field`;
			const petugasMapByName = new Map(
				masterPetugas.map((p) => [
					String(p.nama_petugas).trim().toLowerCase(),
					String(p.id_petugas)
				])
			);

			const headers = parseCSVLine(lines[0]);
			const rows = lines.slice(1).map((line, idx) => {
				const values = parseCSVLine(line);
				const rowObj: Record<string, string> = { _row_idx: String(idx + 2) };
				headers.forEach((header, colIdx) => {
					const rawVal = values[colIdx] ?? '';
					if (header === 'id_petugas' || header === 'tim_petugas') {
						const resolvedList = rawVal
							.split(/[;|]+/)
							.map((token) => {
								const t = token.trim();
								if (!t) return '';
								if (!isNaN(Number(t))) return t;
								return petugasMapByName.get(t.toLowerCase()) ?? t;
							})
							.filter(Boolean);
						rowObj[header] = resolvedList.join(';');
					} else if (header === 'jenis_transaksi') {
						const normalizedJenis = rawVal
							.split(/[;|]+/)
							.map((token) => (token.trim() ? normalizeEnumValue('jenis_transaksi', token) : ''))
							.filter(Boolean);
						rowObj[header] = normalizedJenis.join(';');
					} else {
						rowObj[header] = normalizeEnumValue(header, rawVal);
					}
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
		const errorNotes: string[] = [];

		// Melacak invoice yang sudah di-reset totalnya dalam batch ini agar akumulasi multi-baris akurat
		const processedInvoicesInBatch = new Set<string>();

		try {
			await sql.begin(async (tx) => {
				for (const row of rows) {
					try {
						const today = new Date().toISOString().split('T')[0];

						if (targetTable === 'pelaku_usaha_penugasan') {
							// ===================================================================
							// CSV 1: PELAKU USAHA + PERMOHONAN AUDIT + PENUGASAN + DETAIL PETUGAS
							// ===================================================================
							const idDaftar = (row.id_daftar || '').trim();
							if (!idDaftar) {
								throw new Error(`Baris #${row._row_idx}: Kolom id_daftar wajib diisi.`);
							}

							const kontakPenyelia = (
								row.kontak_penyelia ||
								row.nama_kontak_penyelia ||
								'-'
							).trim();
							const tglPermohonan = (row.tanggal_permohonan || '').trim() || today;

							// 1. Upsert Pelaku Usaha
							await tx`
								INSERT INTO pelaku_usaha (
									id_daftar, nama_pelaku_usaha, jumlah_produk, jumlah_outlet,
									alamat_outlet, jarak_dari_pusat_kota, kontak_penyelia, created_by
								) VALUES (
									${idDaftar}, ${row.nama_pelaku_usaha}, ${parseInt(row.jumlah_produk || '0')},
									${parseInt(row.jumlah_outlet || '0')}, ${row.alamat_outlet || '-'},
									${parseFloat(row.jarak_dari_pusat_kota || '0')}, ${kontakPenyelia}, ${currentUserId}
								)
								ON CONFLICT (id_daftar) DO UPDATE SET
									nama_pelaku_usaha = EXCLUDED.nama_pelaku_usaha,
									jumlah_produk = EXCLUDED.jumlah_produk,
									jumlah_outlet = EXCLUDED.jumlah_outlet,
									alamat_outlet = EXCLUDED.alamat_outlet,
									jarak_dari_pusat_kota = EXCLUDED.jarak_dari_pusat_kota,
									kontak_penyelia = EXCLUDED.kontak_penyelia,
									updated_at = CURRENT_TIMESTAMP;
							`;

							// 2. Upsert Permohonan Audit (1-to-1)
							let idPermohonan: number;
							const existingPerm = await tx`
								SELECT id_permohonan FROM permohonan_audit WHERE id_daftar = ${idDaftar} LIMIT 1
							`;
							if (existingPerm.length === 0) {
								const insPerm = await tx`
									INSERT INTO permohonan_audit (id_daftar, tanggal_permohonan)
									VALUES (${idDaftar}, ${tglPermohonan})
									RETURNING id_permohonan
								`;
								idPermohonan = Number(insPerm[0].id_permohonan);
							} else {
								idPermohonan = Number(existingPerm[0].id_permohonan);
								if (row.tanggal_permohonan) {
									await tx`
										UPDATE permohonan_audit
										SET tanggal_permohonan = ${tglPermohonan}
										WHERE id_permohonan = ${idPermohonan}
									`;
								}
							}

							// 3. Upsert Penugasan & Detail Multi-Petugas (jika ada data penugasan/petugas)
							const rawPetugasStr = (row.id_petugas || row.tim_petugas || '').trim();
							if (rawPetugasStr || row.tanggal_penugasan || row.status_penugasan) {
								const tglPenugasan = (row.tanggal_penugasan || '').trim() || today;
								const statusPenugasan = normalizeEnumValue(
									'status_penugasan',
									row.status_penugasan || 'ASSIGNED'
								);

								const existingPen = await tx`
									SELECT id_penugasan FROM penugasan
									WHERE id_permohonan = ${idPermohonan}
									ORDER BY id_penugasan DESC LIMIT 1
								`;

								let idPenugasan: number;
								if (existingPen.length > 0) {
									idPenugasan = Number(existingPen[0].id_penugasan);
									await tx`
										UPDATE penugasan
										SET tanggal_penugasan = ${tglPenugasan},
										    status_penugasan = ${statusPenugasan}::status_penugasan_enum,
										    updated_at = CURRENT_TIMESTAMP
										WHERE id_penugasan = ${idPenugasan}
									`;
								} else {
									const insPen = await tx`
										INSERT INTO penugasan (
											id_permohonan, tanggal_penugasan, kebutuhan_jumlah_auditor, status_penugasan, assigned_by
										) VALUES (
											${idPermohonan}, ${tglPenugasan}, 1,
											${statusPenugasan}::status_penugasan_enum, ${currentUserId}
										)
										RETURNING id_penugasan
									`;
									idPenugasan = Number(insPen[0].id_penugasan);
								}

								if (rawPetugasStr) {
									const rawPetugasTokens = rawPetugasStr
										.split(/[;|]+/)
										.map((s) => s.trim())
										.filter(Boolean);

									const resolvedPetugasIds: number[] = [];
									for (const token of rawPetugasTokens) {
										let petugasId = parseInt(token);
										if (isNaN(petugasId)) {
											const resPet = await tx`
												SELECT id_petugas FROM petugas_field WHERE nama_petugas ILIKE ${token} LIMIT 1
											`;
											if (resPet.length > 0) petugasId = Number(resPet[0].id_petugas);
										}
										if (petugasId && !isNaN(petugasId) && !resolvedPetugasIds.includes(petugasId)) {
											resolvedPetugasIds.push(petugasId);
										}
									}

									// Sinkronkan daftar petugas untuk penugasan ini
									await tx`DELETE FROM detail_penugasan_petugas WHERE id_penugasan = ${idPenugasan}`;
									for (const pid of resolvedPetugasIds) {
										await tx`
											INSERT INTO detail_penugasan_petugas (id_penugasan, id_petugas)
											VALUES (${idPenugasan}, ${pid})
										`;
									}

									// Hitung otomatis kebutuhan_jumlah_auditor berdasarkan jumlah AUDITOR ter-assign
									await tx`
										UPDATE penugasan
										SET kebutuhan_jumlah_auditor = GREATEST(1, (
											SELECT COUNT(*)::int
											FROM detail_penugasan_petugas dp
											JOIN petugas_field pf ON dp.id_petugas = pf.id_petugas
											WHERE dp.id_penugasan = ${idPenugasan} AND pf.peran = 'AUDITOR'
										))
										WHERE id_penugasan = ${idPenugasan}
									`;
								}
							}
						} else if (targetTable === 'keuangan_audit') {
							// ===================================================================
							// CSV 2: KEUANGAN AUDIT (HEADER INVOICE + DETAIL RINCIAN BIAYA)
							// ===================================================================
							const regId = (row.id_daftar || '').trim();
							let idPermohonan = parseInt(row.id_permohonan || '0');

							if (!idPermohonan && regId) {
								const resPerm = await tx`
									SELECT id_permohonan FROM permohonan_audit WHERE id_daftar = ${regId} LIMIT 1
								`;
								if (resPerm.length > 0) {
									idPermohonan = Number(resPerm[0].id_permohonan);
								}
							}

							if (!idPermohonan || isNaN(idPermohonan)) {
								throw new Error(
									`Baris #${row._row_idx}: Pelaku Usaha "${regId || row.id_permohonan}" belum ada. Impor CSV 1 terlebih dahulu.`
								);
							}

							const noInvoice = (row.no_invoice || '').trim();
							if (!noInvoice) {
								throw new Error(`Baris #${row._row_idx}: Kolom no_invoice wajib diisi.`);
							}

							const statusKeuangan = normalizeEnumValue(
								'status_keuangan',
								row.status_keuangan || 'SIAP_VERIFIKASI'
							);

							// Mendukung format multi-baris (1 item per baris) maupun multi-item dipisah ';'
							const jenisList = (row.jenis_transaksi || '')
								.split(/[;|]+/)
								.map((s) => s.trim())
								.filter(Boolean);
							const nominalList = (row.jumlah_uang || '')
								.split(/[;|]+/)
								.map((s) => parseFloat(s.trim() || '0'));
							const ketList = (row.catatan_revisi || row.keterangan || '')
								.split(/[;|]+/)
								.map((s) => s.trim());

							const itemCount = Math.max(jenisList.length, nominalList.length);
							const barisItems: { jenis: string; nominal: number; keterangan: string | null }[] =
								[];
							let subtotalBaris = 0;

							for (let i = 0; i < itemCount; i++) {
								const nominal = nominalList[i] ?? 0;
								if (isNaN(nominal) || nominal <= 0) continue;

								const jenis = normalizeEnumValue(
									'jenis_transaksi',
									jenisList[i] || jenisList[0] || 'BIAYA_LAIN'
								);
								const ket = ketList[i] || ketList[0] || null;
								barisItems.push({ jenis, nominal, keterangan: ket });
								subtotalBaris += nominal;
							}

							if (barisItems.length === 0) {
								throw new Error(`Baris #${row._row_idx}: Nominal jumlah_uang tidak valid.`);
							}

							let idKeuangan: number;
							if (!processedInvoicesInBatch.has(noInvoice)) {
								const resHeader = await tx`
									INSERT INTO keuangan_audit (
										id_permohonan, no_invoice, total_tagihan, status_keuangan, created_by
									) VALUES (
										${idPermohonan}, ${noInvoice}, ${subtotalBaris},
										${statusKeuangan}::status_keuangan_enum, ${currentUserId}
									)
									ON CONFLICT (no_invoice) DO UPDATE SET
										id_permohonan = EXCLUDED.id_permohonan,
										total_tagihan = EXCLUDED.total_tagihan,
										status_keuangan = EXCLUDED.status_keuangan,
										updated_at = CURRENT_TIMESTAMP
									RETURNING id_keuangan;
								`;
								idKeuangan = Number(resHeader[0].id_keuangan);
								await tx`DELETE FROM detail_keuangan_audit WHERE id_keuangan = ${idKeuangan}`;
								processedInvoicesInBatch.add(noInvoice);
							} else {
								const resHeader = await tx`
									UPDATE keuangan_audit
									SET total_tagihan = total_tagihan + ${subtotalBaris},
									    updated_at = CURRENT_TIMESTAMP
									WHERE no_invoice = ${noInvoice}
									RETURNING id_keuangan;
								`;
								idKeuangan = Number(resHeader[0].id_keuangan);
							}

							for (const item of barisItems) {
								await tx`
									INSERT INTO detail_keuangan_audit (
										id_keuangan, jenis_transaksi, jumlah_uang, keterangan
									) VALUES (
										${idKeuangan}, ${item.jenis}::jenis_transaksi_enum, ${item.nominal}, ${item.keterangan}
									);
								`;
							}
						}

						successCount++;
					} catch (rowErr) {
						console.error(`Error import row #${row._row_idx} (${targetTable}):`, rowErr);
						failCount++;
						errorNotes.push(
							rowErr instanceof Error ? rowErr.message : `Baris #${row._row_idx} gagal`
						);
					}
				}
			});

			const labelTahap =
				targetTable === 'pelaku_usaha_penugasan'
					? 'Pelaku Usaha & Penugasan'
					: 'Keuangan & Rincian Biaya';

			return {
				success: true,
				importedTable: targetTable,
				message: `Impor "${labelTahap}" selesai! ${successCount} baris berhasil disimpan${failCount > 0 ? `, ${failCount} gagal (${errorNotes.slice(0, 2).join('; ')}).` : '.'}`
			};
		} catch (err) {
			console.error('Error execute import:', err);
			return fail(500, { error: 'Gagal mengeksekusi impor data ke database.' });
		}
	}
} satisfies Actions;
