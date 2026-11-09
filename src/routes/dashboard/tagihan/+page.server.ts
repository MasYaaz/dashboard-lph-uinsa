import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sql } from '#lib/server/db.ts';
import type { StatusKeuangan, DetailKeuanganAudit } from '#lib/types.ts';

export interface TagihanKeuanganItem {
	id_keuangan: number;
	no_invoice: string;
	id_daftar: string;
	nama_pu: string;
	total_tagihan: number;
	status_keuangan: StatusKeuangan;
	tgl_diterbitkan: string;
	items: DetailKeuanganAudit[];
}

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	if (user.role !== 'BENDAHARA' && user.role !== 'ADMINISTRASI') {
		throw redirect(303, '/dashboard');
	}

	try {
		// 1. Mengambil data Header Invoice bergabung ke pelaku_usaha & permohonan_audit
		const daftarHeaderRaw = await sql`
			SELECT
				k.id_keuangan,
				k.no_invoice,
				pa.id_daftar,
				pu.nama_pelaku_usaha AS nama_pu,
				k.total_tagihan,
				k.status_keuangan,
				k.created_at AS tgl_diterbitkan
			FROM keuangan_audit k
			JOIN permohonan_audit pa ON k.id_permohonan = pa.id_permohonan
			JOIN pelaku_usaha pu ON pa.id_daftar = pu.id_daftar
			ORDER BY k.created_at DESC, k.id_keuangan DESC
		`;

		if (daftarHeaderRaw.length === 0) {
			return { daftarTagihan: [] };
		}

		// 2. Mengambil seluruh detail rincian biaya terkait invoice tersebut
		const idKeuanganList = daftarHeaderRaw.map((row) => Number(row.id_keuangan));
		const detailItemsRaw = await sql`
			SELECT
				id_detail_keuangan,
				id_keuangan,
				jenis_transaksi,
				keterangan,
				jumlah_uang,
				created_at
			FROM detail_keuangan_audit
			WHERE id_keuangan = ANY(${idKeuanganList})
			ORDER BY id_detail_keuangan ASC
		`;

		// 3. Mapping data detail ke masing-masing header invoice
		const detailMap = new Map<number, DetailKeuanganAudit[]>();
		for (const item of detailItemsRaw) {
			const idK = Number(item.id_keuangan);
			if (!detailMap.has(idK)) {
				detailMap.set(idK, []);
			}
			detailMap.get(idK)!.push({
				id_detail_keuangan: Number(item.id_detail_keuangan),
				id_keuangan: idK,
				jenis_transaksi: item.jenis_transaksi,
				keterangan: item.keterangan ? String(item.keterangan) : null,
				jumlah_uang: Number(item.jumlah_uang),
				created_at: item.created_at
			});
		}

		const daftarTagihan: TagihanKeuanganItem[] = daftarHeaderRaw.map((row) => {
			const idK = Number(row.id_keuangan);
			return {
				id_keuangan: idK,
				no_invoice: String(row.no_invoice),
				id_daftar: String(row.id_daftar),
				nama_pu: String(row.nama_pu),
				total_tagihan: Number(row.total_tagihan),
				status_keuangan: row.status_keuangan as StatusKeuangan,
				tgl_diterbitkan: new Date(row.tgl_diterbitkan).toLocaleDateString('id-ID', {
					day: 'numeric',
					month: 'short',
					year: 'numeric'
				}),
				items: detailMap.get(idK) ?? []
			};
		});

		return { daftarTagihan };
	} catch (err) {
		console.error('Error load daftar tagihan header-detail:', err);
		return { daftarTagihan: [] };
	}
};

export const actions = {
	konfirmasiPembayaran: async ({ request, cookies, locals }) => {
		const formData = await request.formData();
		const id_keuangan = formData.get('id_keuangan')?.toString().trim();
		if (!id_keuangan) {
			return fail(400, { error: 'ID Keuangan tidak valid.' });
		}

		const userIdStr =
			cookies.get('session_user_id') || (locals.user?.id_user ? String(locals.user.id_user) : null);
		const currentUserId = userIdStr ? parseInt(userIdStr) : null;

		try {
			const idKeuanganInt = parseInt(id_keuangan);

			// Update status Header Invoice menjadi DITERIMA (Lunas)
			const res = await sql`
				UPDATE keuangan_audit
				SET
					status_keuangan = 'DITERIMA',
					verified_by = ${currentUserId},
					updated_at = CURRENT_TIMESTAMP
				WHERE id_keuangan = ${idKeuanganInt}
				RETURNING no_invoice;
			`;

			if (res.length === 0) {
				return fail(404, { error: 'Data invoice tidak ditemukan.' });
			}

			return {
				success: true,
				message: `Pembayaran Invoice "${res[0].no_invoice}" berhasil diverifikasi dan diubah menjadi DITERIMA (Lunas)!`
			};
		} catch (err) {
			console.error('Error konfirmasi pembayaran:', err);
			return fail(500, { error: 'Gagal mengonfirmasi pembayaran invoice tagihan.' });
		}
	},

	hapusTagihan: async ({ request }) => {
		const formData = await request.formData();
		const id_keuangan = formData.get('id_keuangan')?.toString().trim();
		if (!id_keuangan) {
			return fail(400, { error: 'ID Keuangan tidak valid.' });
		}

		try {
			const idKeuanganInt = parseInt(id_keuangan);

			// Menghapus header invoice (Detail otomatis terhapus via CASCADE)
			const res = await sql`
				DELETE FROM keuangan_audit
				WHERE id_keuangan = ${idKeuanganInt}
				RETURNING no_invoice;
			`;

			if (res.length === 0) {
				return fail(404, { error: 'Data invoice tidak ditemukan.' });
			}

			return {
				success: true,
				message: `Invoice tagihan "${res[0].no_invoice}" beserta seluruh rinciannya berhasil dihapus!`
			};
		} catch (err) {
			console.error('Error hapus tagihan:', err);
			return fail(500, { error: 'Gagal menghapus invoice tagihan.' });
		}
	}
} satisfies Actions;
