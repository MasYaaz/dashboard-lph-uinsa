import { fail, redirect, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { sql } from '#lib/server/db.ts';
import type { KeuanganAudit } from '#lib/types/database.ts';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { user } = await parent();
	if (user.role !== 'BENDAHARA') throw redirect(303, '/dashboard');

	const targetId = parseInt(params.id);
	if (isNaN(targetId)) throw error(404, 'ID Tagihan tidak ditemukan.');

	const res = await sql<KeuanganAudit[]>`
		SELECT ka.*, pu.nama_pelaku_usaha AS nama_pu
		FROM keuangan_audit ka
		JOIN permohonan_audit pa ON ka.id_permohonan = pa.id_permohonan
		JOIN pelaku_usaha pu ON pa.id_daftar = pu.id_daftar
		WHERE ka.id_keuangan = ${targetId} LIMIT 1
	`;

	if (res.length === 0) throw error(404, 'Data tagihan tidak ditemukan.');
	if (res[0].status_keuangan === 'DITERIMA') throw redirect(303, '/dashboard/keuangan/konfirmasi');

	return {
		tagihan: {
			id_keuangan: Number(res[0].id_keuangan),
			no_invoice: String(res[0].no_invoice),
			nama_pu: String((res[0] as unknown as { nama_pu: string }).nama_pu ?? '-'),
			biaya_transport_talangan: Number(res[0].biaya_transport_talangan || 0),
			biaya_uh_penginapan: Number(res[0].biaya_uh_penginapan || 0),
			biaya_input_sistem: Number(res[0].biaya_input_sistem || 0),
			penambahan_produk: Number(res[0].penambahan_produk || 0),
			penambahan_outlet: Number(res[0].penambahan_outlet || 0),
			biaya_tambahan: Number(res[0].biaya_tambahan || 0),
			total_biaya_final: Number(res[0].total_biaya_final || 0),
			catatan_revisi: res[0].catatan_revisi ? String(res[0].catatan_revisi) : ''
		}
	};
};

export const actions = {
	default: async ({ request, params }) => {
		const targetId = parseInt(params.id);
		const formData = await request.formData();

		const biaya_transport_talangan = parseFloat(
			formData.get('biaya_transport_talangan')?.toString() || '0'
		);
		const biaya_uh_penginapan = parseFloat(formData.get('biaya_uh_penginapan')?.toString() || '0');
		const biaya_input_sistem = parseFloat(formData.get('biaya_input_sistem')?.toString() || '0');
		const penambahan_produk = parseInt(formData.get('penambahan_produk')?.toString() || '0');
		const penambahan_outlet = parseInt(formData.get('penambahan_outlet')?.toString() || '0');
		const biaya_tambahan = parseFloat(formData.get('biaya_tambahan')?.toString() || '0');
		const catatan_revisi = formData.get('catatan_revisi')?.toString().trim() || null;

		const total_biaya_lph = biaya_transport_talangan + biaya_uh_penginapan;
		const total_biaya_final = total_biaya_lph + biaya_tambahan;

		if (total_biaya_final <= 0) {
			return fail(400, { error: 'Total Biaya Final harus lebih besar dari Rp 0.' });
		}

		try {
			await sql`
				UPDATE keuangan_audit
				SET
					biaya_transport_talangan = ${biaya_transport_talangan},
					biaya_uh_penginapan = ${biaya_uh_penginapan},
					total_biaya_lph = ${total_biaya_lph},
					biaya_input_sistem = ${biaya_input_sistem},
					penambahan_produk = ${penambahan_produk},
					penambahan_outlet = ${penambahan_outlet},
					biaya_tambahan = ${biaya_tambahan},
					total_biaya_final = ${total_biaya_final},
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
