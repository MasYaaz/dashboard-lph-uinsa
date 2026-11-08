import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sql } from '#lib/server/db.ts';
import type { JenisTransaksiEnum } from '#lib/types.ts';

export interface KonfirmasiTagihanItem {
	id_keuangan: number;
	id_daftar: string;
	nama_pu: string;
	no_invoice: string;
	jenis_transaksi: JenisTransaksiEnum;
	jumlah_uang: number;
	status_keuangan: string;
	catatan_revisi: string | null;
	tgl_diterbitkan: string;
}

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	if (user.role !== 'BENDAHARA') {
		throw redirect(303, '/dashboard');
	}

	try {
		const daftarTagihanRaw = await sql`
			SELECT
				ka.id_keuangan,
				pa.id_daftar,
				pu.nama_pelaku_usaha AS nama_pu,
				ka.no_invoice,
				ka.jenis_transaksi::text AS jenis_transaksi,
				COALESCE(ka.jumlah_uang, 0) AS jumlah_uang,
				ka.status_keuangan::text AS status_keuangan,
				ka.catatan_revisi,
				ka.created_at
			FROM keuangan_audit ka
			JOIN permohonan_audit pa ON ka.id_permohonan = pa.id_permohonan
			JOIN pelaku_usaha pu ON pa.id_daftar = pu.id_daftar
			ORDER BY ka.created_at DESC
		`;

		const daftarTagihan: KonfirmasiTagihanItem[] = daftarTagihanRaw.map((r) => ({
			id_keuangan: Number(r.id_keuangan),
			id_daftar: String(r.id_daftar),
			nama_pu: String(r.nama_pu),
			no_invoice: String(r.no_invoice),
			jenis_transaksi: r.jenis_transaksi as JenisTransaksiEnum,
			jumlah_uang: Number(r.jumlah_uang),
			status_keuangan: String(r.status_keuangan ?? 'SIAP_VERIFIKASI'),
			catatan_revisi: r.catatan_revisi ? String(r.catatan_revisi) : null,
			tgl_diterbitkan: new Date(r.created_at).toLocaleDateString('id-ID', {
				day: 'numeric',
				month: 'short',
				year: 'numeric'
			})
		}));

		return { daftarTagihan };
	} catch (err) {
		console.error('Error load konfirmasi tagihan:', err);
		return { daftarTagihan: [] };
	}
};

export const actions = {
	konfirmasiPembayaran: async ({ request, locals }) => {
		const formData = await request.formData();
		const id_keuangan = formData.get('id_keuangan')?.toString();

		if (!id_keuangan) return fail(400, { success: false, error: 'ID Tagihan tidak valid.' });

		try {
			const targetId = parseInt(id_keuangan);
			const currentUserId = locals.user?.id_user || null;

			await sql`
				UPDATE keuangan_audit
				SET
					status_keuangan = 'DITERIMA'::status_keuangan_enum,
					verified_by = ${currentUserId},
					updated_at = NOW()
				WHERE id_keuangan = ${targetId}
			`;

			return {
				success: true,
				message: 'Pembayaran invoice berhasil diverifikasi & dikonfirmasi (DITERIMA)!'
			};
		} catch (err) {
			console.error('Error konfirmasi pembayaran:', err);
			return fail(500, { success: false, error: 'Gagal memverifikasi pembayaran.' });
		}
	},

	hapusTagihan: async ({ request }) => {
		const formData = await request.formData();
		const id_keuangan = formData.get('id_keuangan')?.toString();

		if (!id_keuangan) return fail(400, { success: false, error: 'ID Tagihan tidak valid.' });

		try {
			const targetId = parseInt(id_keuangan);
			const checkStatus = await sql`
				SELECT status_keuangan::text AS status_keuangan, no_invoice
				FROM keuangan_audit
				WHERE id_keuangan = ${targetId}
				LIMIT 1
			`;

			if (checkStatus.length === 0 || checkStatus[0].status_keuangan === 'DITERIMA') {
				return fail(400, {
					success: false,
					error: 'Invoice yang sudah berstatus DITERIMA tidak dapat dihapus.'
				});
			}

			await sql`DELETE FROM keuangan_audit WHERE id_keuangan = ${targetId}`;

			return { success: true, message: `Invoice ${checkStatus[0].no_invoice} berhasil dihapus.` };
		} catch (err) {
			console.error('Error hapus tagihan:', err);
			return fail(500, { success: false, error: 'Gagal menghapus data tagihan.' });
		}
	}
} satisfies Actions;
