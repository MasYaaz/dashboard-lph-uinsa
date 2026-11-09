import { fail, redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sql } from '#lib/server/db.ts';
import type { JenisTransaksiEnum } from '#lib/types.ts';

export interface PermohonanDetailTagihan {
	id_keuangan: number;
	id_permohonan: number;
	id_daftar: string;
	nama_pu: string;
	no_invoice: string;
}

export interface ItemTagihanExisting {
	id_detail_keuangan?: number;
	jenis_transaksi: JenisTransaksiEnum;
	jumlah_uang: number;
	catatan?: string;
}

export const load: PageServerLoad = async ({ params, parent }) => {
	const { user } = await parent();
	if (user.role !== 'BENDAHARA' && user.role !== 'ADMINISTRASI') {
		throw redirect(303, '/dashboard');
	}

	const idKeuangan = parseInt(params.id);
	if (isNaN(idKeuangan)) {
		throw error(400, 'ID Keuangan tidak valid.');
	}

	try {
		// 1. Ambil data Header Tagihan Target
		const targetKeuangan = await sql`
			SELECT k.id_keuangan, k.no_invoice, k.id_permohonan, k.status_keuangan, pa.id_daftar, pu.nama_pelaku_usaha AS nama_pu
			FROM keuangan_audit k
			JOIN permohonan_audit pa ON k.id_permohonan = pa.id_permohonan
			JOIN pelaku_usaha pu ON pa.id_daftar = pu.id_daftar
			WHERE k.id_keuangan = ${idKeuangan}
			LIMIT 1
		`;

		if (targetKeuangan.length === 0) {
			throw error(404, 'Invoice tagihan tidak ditemukan.');
		}

		// Jika status tagihan sudah DITERIMA (Lunas), cegah pengeditan
		if (targetKeuangan[0].status_keuangan === 'DITERIMA') {
			throw error(403, 'Invoice tagihan yang sudah terverifikasi (DITERIMA) tidak dapat diubah.');
		}

		// 2. Ambil seluruh item komponen biaya dari detail_keuangan_audit
		const itemsRaw = await sql`
			SELECT id_detail_keuangan, jenis_transaksi, jumlah_uang, keterangan
			FROM detail_keuangan_audit
			WHERE id_keuangan = ${idKeuangan}
			ORDER BY id_detail_keuangan ASC
		`;

		const detailTagihan: PermohonanDetailTagihan = {
			id_keuangan: Number(targetKeuangan[0].id_keuangan),
			id_permohonan: Number(targetKeuangan[0].id_permohonan),
			id_daftar: String(targetKeuangan[0].id_daftar),
			nama_pu: String(targetKeuangan[0].nama_pu),
			no_invoice: String(targetKeuangan[0].no_invoice)
		};

		const itemsTagihan: ItemTagihanExisting[] = itemsRaw.map((row) => ({
			id_detail_keuangan: Number(row.id_detail_keuangan),
			jenis_transaksi: row.jenis_transaksi as JenisTransaksiEnum,
			jumlah_uang: Number(row.jumlah_uang),
			catatan: row.keterangan ? String(row.keterangan) : ''
		}));

		return { detailTagihan, itemsTagihan };
	} catch (err) {
		console.error('Error loading detail tagihan edit:', err);
		throw error(404, 'Data tagihan keuangan tidak ditemukan.');
	}
};

export const actions = {
	updateTagihan: async ({ request, params }) => {
		const idKeuangan = parseInt(params.id);
		const formData = await request.formData();
		const itemsJson = formData.get('items_json')?.toString().trim();

		if (isNaN(idKeuangan) || !itemsJson) {
			return fail(400, { error: 'Data rincian komponen tagihan wajib diisi.' });
		}

		let items: ItemTagihanExisting[];
		try {
			items = JSON.parse(itemsJson);
		} catch {
			return fail(400, { error: 'Format komponen rincian biaya tidak valid.' });
		}

		if (!Array.isArray(items) || items.length === 0) {
			return fail(400, { error: 'Minimal harus memasukkan 1 komponen biaya tagihan.' });
		}

		const validItems = items.filter((item) => Number(item.jumlah_uang) > 0);
		if (validItems.length === 0) {
			return fail(400, { error: 'Nominal komponen biaya harus lebih besar dari Rp 0.' });
		}

		const totalTagihanBaru = validItems.reduce((sum, item) => sum + Number(item.jumlah_uang), 0);

		try {
			await sql.begin(async (tx) => {
				// 1. Cek keberadaan Header Tagihan
				const target = await tx`
					SELECT id_keuangan, status_keuangan
					FROM keuangan_audit
					WHERE id_keuangan = ${idKeuangan}
					LIMIT 1
				`;

				if (target.length === 0) {
					throw new Error('Data tagihan tidak ditemukan.');
				}

				if (target[0].status_keuangan === 'DITERIMA') {
					throw new Error('Invoice yang sudah LUNAS tidak dapat diubah.');
				}

				// 2. Update Total Tagihan & Pengedit di Header Invoice
				await tx`
					UPDATE keuangan_audit
					SET
						total_tagihan = ${totalTagihanBaru},
						updated_at = CURRENT_TIMESTAMP
					WHERE id_keuangan = ${idKeuangan}
				`;

				// 3. Hapus detail komponen biaya lama
				await tx`
					DELETE FROM detail_keuangan_audit
					WHERE id_keuangan = ${idKeuangan}
				`;

				// 4. Insert ulang rincian komponen biaya yang baru ke detail_keuangan_audit
				for (const item of validItems) {
					const keteranganFinal = item.catatan ? item.catatan.trim() : null;
					await tx`
						INSERT INTO detail_keuangan_audit (
							id_keuangan, jenis_transaksi, jumlah_uang, keterangan
						) VALUES (
							${idKeuangan}, ${item.jenis_transaksi}::jenis_transaksi_enum, ${Number(item.jumlah_uang)}, ${keteranganFinal}
						)
					`;
				}
			});
		} catch (err) {
			console.error('Error update tagihan header-detail:', err);
			return fail(500, { error: 'Terjadi kesalahan sistem saat memperbarui invoice tagihan.' });
		}

		throw redirect(303, '/dashboard/tagihan');
	}
} satisfies Actions;
