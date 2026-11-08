import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sql } from '#lib/server/db.ts';
import type { JenisTransaksiEnum } from '#lib/types.ts';

export interface PermohonanSiapTagihItem {
	id_daftar: string;
	nama_pu: string;
	jenis_pengajuan: string;
	skala_usaha: string;
	jumlah_produk: number;
	jumlah_outlet: number;
	alamat_outlet: string;
	jarak: number;
}

export interface TagihanItem {
	id_keuangan: number;
	id_daftar: string;
	nama_pu: string;
	no_invoice: string;
	jenis_transaksi: JenisTransaksiEnum;
	jumlah_uang: number;
	catatan_revisi: string | null;
	status_keuangan: string;
	tgl_diterbitkan: string;
}

interface ItemTransaksiPayload {
	id?: string;
	jenis_transaksi: JenisTransaksiEnum;
	jumlah_uang: number;
	catatan?: string;
}

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	if (user.role !== 'BENDAHARA') {
		throw redirect(303, '/dashboard');
	}

	try {
		// 1. Ambil permohonan audit yang sudah memiliki penugasan tetapi belum memiliki tagihan/keuangan
		const permohonanSiapTagihRaw = await sql`
			SELECT
				pa.id_daftar,
				pu.nama_pelaku_usaha AS nama_pu,
				'Pemeriksaan Halal' AS jenis_pengajuan,
				COALESCE(pu.jumlah_produk, 1) AS jumlah_produk,
				COALESCE(pu.jumlah_outlet, 1) AS jumlah_outlet,
				COALESCE(pu.alamat_outlet, '-') AS alamat_outlet,
				COALESCE(pu.jarak_dari_pusat_kota, 0) AS jarak
			FROM permohonan_audit pa
			JOIN pelaku_usaha pu ON pa.id_daftar = pu.id_daftar
			JOIN penugasan p ON pa.id_permohonan = p.id_permohonan
			LEFT JOIN keuangan_audit ka ON pa.id_permohonan = ka.id_permohonan
			WHERE ka.id_keuangan IS NULL
			ORDER BY pa.tanggal_permohonan ASC
		`;

		// 2. Ambil riwayat daftar tagihan keuangan
		const daftarTagihanRaw = await sql`
			SELECT
				ka.id_keuangan,
				pa.id_daftar,
				pu.nama_pelaku_usaha AS nama_pu,
				ka.no_invoice,
				ka.jenis_transaksi::text AS jenis_transaksi,
				COALESCE(ka.jumlah_uang, 0) AS jumlah_uang,
				ka.catatan_revisi,
				ka.status_keuangan::text AS status_keuangan,
				ka.created_at
			FROM keuangan_audit ka
			JOIN permohonan_audit pa ON ka.id_permohonan = pa.id_permohonan
			JOIN pelaku_usaha pu ON pa.id_daftar = pu.id_daftar
			ORDER BY ka.created_at DESC
		`;

		const permohonanSiapTagih: PermohonanSiapTagihItem[] = permohonanSiapTagihRaw.map((r) => ({
			id_daftar: String(r.id_daftar),
			nama_pu: String(r.nama_pu),
			jenis_pengajuan: String(r.jenis_pengajuan),
			skala_usaha: 'Mikro',
			jumlah_produk: Number(r.jumlah_produk),
			jumlah_outlet: Number(r.jumlah_outlet),
			alamat_outlet: String(r.alamat_outlet),
			jarak: Number(r.jarak)
		}));

		const daftarTagihan: TagihanItem[] = daftarTagihanRaw.map((r) => ({
			id_keuangan: Number(r.id_keuangan),
			id_daftar: String(r.id_daftar),
			nama_pu: String(r.nama_pu),
			no_invoice: String(r.no_invoice),
			jenis_transaksi: r.jenis_transaksi as JenisTransaksiEnum,
			jumlah_uang: Number(r.jumlah_uang),
			catatan_revisi: r.catatan_revisi ? String(r.catatan_revisi) : null,
			status_keuangan: String(r.status_keuangan),
			tgl_diterbitkan: new Date(r.created_at).toLocaleDateString('id-ID', {
				day: 'numeric',
				month: 'short',
				year: 'numeric'
			})
		}));

		return { permohonanSiapTagih, daftarTagihan };
	} catch (err) {
		console.error('Error load tagihan terpadu:', err);
		return { permohonanSiapTagih: [], daftarTagihan: [] };
	}
};

export const actions = {
	terbitkanTagihan: async ({ request, locals }) => {
		const formData = await request.formData();
		const id_daftar = formData.get('id_daftar')?.toString().trim();
		const no_invoice_manual = formData.get('no_invoice')?.toString().trim();
		const itemsJson = formData.get('items_json')?.toString().trim();

		if (!id_daftar) {
			return fail(400, { success: false, error: 'Pilih Permohonan Audit terlebih dahulu.' });
		}

		// Parsing payload multi-item dari frontend
		let items: ItemTransaksiPayload[] = [];
		try {
			if (itemsJson) {
				items = JSON.parse(itemsJson);
			}
		} catch (error) {
			return fail(400, { success: false, error: error });
		}

		// Jika tidak ada JSON array (fallback ke single item legacy)
		if (items.length === 0) {
			const jenis_transaksi = formData
				.get('jenis_transaksi')
				?.toString()
				.trim() as JenisTransaksiEnum;
			const jumlah_uang = parseFloat(formData.get('jumlah_uang')?.toString() || '0');
			const catatan = formData.get('catatan_perhitungan')?.toString().trim() || undefined;

			if (jenis_transaksi && jumlah_uang > 0) {
				items.push({ jenis_transaksi, jumlah_uang, catatan });
			}
		}

		if (items.length === 0) {
			return fail(400, { success: false, error: 'Minimal harus ada 1 komponen biaya transaksi.' });
		}

		// Validasi nominal tiap item
		for (const item of items) {
			if (!item.jenis_transaksi) {
				return fail(400, {
					success: false,
					error: 'Jenis transaksi pada komponen biaya tidak boleh kosong.'
				});
			}
			if (!item.jumlah_uang || item.jumlah_uang <= 0) {
				return fail(400, {
					success: false,
					error: 'Jumlah uang pada komponen biaya harus lebih dari Rp 0.'
				});
			}
		}

		const currentYear = new Date().getFullYear();
		const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
		const randomCode = Math.floor(1000 + Math.random() * 9000);
		const no_invoice = no_invoice_manual || `INV/LPH/${currentMonth}/${currentYear}/${randomCode}`;

		try {
			// Cek duplikasi nomor invoice
			const checkDuplicate = await sql`
				SELECT id_keuangan FROM keuangan_audit WHERE no_invoice = ${no_invoice} LIMIT 1
			`;

			if (checkDuplicate.length > 0) {
				return fail(400, {
					success: false,
					error: `Nomor Invoice ${no_invoice} sudah pernah digunakan.`
				});
			}

			// Cek keberadaan ID Permohonan
			const permohonanRes = await sql`
				SELECT id_permohonan FROM permohonan_audit WHERE id_daftar = ${id_daftar} LIMIT 1
			`;

			if (permohonanRes.length === 0) {
				return fail(404, { success: false, error: 'Data permohonan audit tidak ditemukan.' });
			}

			const id_permohonan = permohonanRes[0].id_permohonan;
			const currentUserId = locals.user?.id_user || null;

			// Simpan seluruh multi-item transaksi dalam 1 transaksi DB (sql.begin)
			await sql.begin(async (tx) => {
				for (const item of items) {
					await tx`
						INSERT INTO keuangan_audit (
							id_permohonan,
							no_invoice,
							jenis_transaksi,
							jumlah_uang,
							catatan_revisi,
							status_keuangan,
							created_by
						) VALUES (
							${id_permohonan},
							${no_invoice},
							${item.jenis_transaksi}::jenis_transaksi_enum,
							${item.jumlah_uang},
							${item.catatan || null},
							'SIAP_VERIFIKASI'::status_keuangan_enum,
							${currentUserId}
						)
					`;
				}
			});

			return {
				success: true,
				message: `Berhasil menyimpan ${items.length} komponen rincian biaya & Invoice ${no_invoice}!`
			};
		} catch (err) {
			console.error('Error terbit tagihan:', err);
			return fail(500, {
				success: false,
				error: 'Gagal menyimpan rincian biaya audit ke database.'
			});
		}
	}
} satisfies Actions;
