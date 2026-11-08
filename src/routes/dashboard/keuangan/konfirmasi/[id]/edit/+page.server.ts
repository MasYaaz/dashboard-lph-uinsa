import { fail, redirect, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { sql } from '#lib/server/db.ts';
import type { KeuanganAudit, JenisTransaksiEnum } from '#lib/types.ts';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { user } = await parent();
	if (user.role !== 'BENDAHARA') throw redirect(303, '/dashboard');

	const targetId = parseInt(params.id);
	if (isNaN(targetId)) throw error(404, 'ID Tagihan tidak ditemukan.');

	const res = await sql<(KeuanganAudit & { nama_pu: string })[]>`
		SELECT
			ka.id_keuangan,
			ka.id_permohonan,
			ka.no_invoice,
			ka.jenis_transaksi::text AS jenis_transaksi,
			ka.jumlah_uang,
			ka.status_keuangan::text AS status_keuangan,
			ka.catatan_revisi,
			pu.nama_pelaku_usaha AS nama_pu
		FROM keuangan_audit ka
		JOIN permohonan_audit pa ON ka.id_permohonan = pa.id_permohonan
		JOIN pelaku_usaha pu ON pa.id_daftar = pu.id_daftar
		WHERE ka.id_keuangan = ${targetId}
		LIMIT 1
	`;

	if (res.length === 0) throw error(404, 'Data tagihan tidak ditemukan.');
	if (res[0].status_keuangan === 'DITERIMA') throw redirect(303, '/dashboard/keuangan/konfirmasi');

	return {
		tagihan: {
			id_keuangan: Number(res[0].id_keuangan),
			no_invoice: String(res[0].no_invoice),
			nama_pu: String(res[0].nama_pu ?? '-'),
			jenis_transaksi: res[0].jenis_transaksi as JenisTransaksiEnum,
			jumlah_uang: Number(res[0].jumlah_uang),
			catatan_revisi: res[0].catatan_revisi ? String(res[0].catatan_revisi) : ''
		}
	};
};

export const actions = {
	default: async ({ request, params }) => {
		const targetId = parseInt(params.id);
		if (isNaN(targetId)) return fail(400, { error: 'ID Tagihan tidak valid.' });

		const formData = await request.formData();
		const jenis_transaksi = formData
			.get('jenis_transaksi')
			?.toString()
			.trim() as JenisTransaksiEnum;
		const jumlah_uang = parseFloat(formData.get('jumlah_uang')?.toString() || '0');
		const catatan_revisi = formData.get('catatan_perhitungan')?.toString().trim() || null;

		if (!jenis_transaksi) {
			return fail(400, { error: 'Jenis transaksi wajib dipilih.' });
		}

		if (jumlah_uang <= 0) {
			return fail(400, { error: 'Jumlah Uang harus lebih besar dari Rp 0.' });
		}

		try {
			await sql`
				UPDATE keuangan_audit
				SET
					jenis_transaksi = ${jenis_transaksi}::jenis_transaksi_enum,
					jumlah_uang = ${jumlah_uang},
					catatan_revisi = ${catatan_revisi},
					updated_at = NOW()
				WHERE id_keuangan = ${targetId} AND status_keuangan != 'DITERIMA'
			`;
		} catch (err) {
			console.error('Error update keuangan_audit:', err);
			return fail(500, { error: 'Gagal memperbarui rincian keuangan audit.' });
		}

		throw redirect(303, '/dashboard/keuangan/konfirmasi');
	}
} satisfies Actions;
