import { fail, redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sql } from '#lib/server/db.ts';
import type { PelakuUsaha } from '#lib/types.ts';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { user } = await parent();
	if (user.role !== 'ADMINISTRASI') {
		throw redirect(303, '/dashboard');
	}

	const idDaftar = params.id;

	try {
		const result = await sql<PelakuUsaha[]>`
			SELECT
				id_daftar,
				nama_pelaku_usaha,
				jumlah_produk,
				jumlah_outlet,
				alamat_outlet,
				jarak_dari_pusat_kota,
				kontak_penyelia
			FROM pelaku_usaha
			WHERE id_daftar = ${idDaftar}
			LIMIT 1
		`;

		if (result.length === 0) {
			throw error(404, `Pelaku Usaha dengan ID ${idDaftar} tidak ditemukan.`);
		}

		const item = result[0];

		return {
			pelakuUsaha: {
				id_daftar: String(item.id_daftar),
				nama_pelaku_usaha: String(item.nama_pelaku_usaha),
				jumlah_produk: Number(item.jumlah_produk),
				jumlah_outlet: Number(item.jumlah_outlet),
				alamat_outlet: String(item.alamat_outlet),
				jarak_dari_pusat_kota: Number(item.jarak_dari_pusat_kota),
				kontak_penyelia: String(item.kontak_penyelia)
			}
		};
	} catch (err) {
		console.error('Error loading detail pelaku usaha:', err);
		throw error(404, `Pelaku Usaha dengan ID ${idDaftar} tidak ditemukan.`);
	}
};

export const actions = {
	update: async ({ request, params }) => {
		const idDaftar = params.id;
		const formData = await request.formData();

		const nama_pu = formData.get('nama_pu')?.toString().trim();
		const jumlah_produk = parseInt(formData.get('jumlah_produk')?.toString() || '1');
		const jumlah_outlet = parseInt(formData.get('jumlah_outlet')?.toString() || '1');
		const alamat_outlet = formData.get('alamat_outlet')?.toString().trim();
		const jarak = parseFloat(formData.get('jarak')?.toString() || '0');
		const kontak_penyelia = formData.get('kontak_penyelia')?.toString().trim();

		const values = {
			id_daftar: idDaftar,
			nama_pu,
			jumlah_produk,
			jumlah_outlet,
			alamat_outlet,
			jarak,
			kontak_penyelia
		};

		// 1. Validasi Input Kosong
		if (!nama_pu || !alamat_outlet || isNaN(jarak) || !kontak_penyelia) {
			return fail(400, {
				error: 'Seluruh kolom wajib diisi dengan benar.',
				values
			});
		}

		try {
			// 2. Query Update Pelaku Usaha
			await sql`
				UPDATE pelaku_usaha
				SET
					nama_pelaku_usaha = ${nama_pu},
					jumlah_produk = ${jumlah_produk},
					jumlah_outlet = ${jumlah_outlet},
					alamat_outlet = ${alamat_outlet},
					jarak_dari_pusat_kota = ${jarak},
					kontak_penyelia = ${kontak_penyelia},
					updated_at = CURRENT_TIMESTAMP
				WHERE id_daftar = ${idDaftar}
			`;
		} catch (err) {
			console.error('Error update pelaku usaha:', err);
			return fail(500, {
				error: 'Terjadi kesalahan sistem saat memperbarui data pelaku usaha.',
				values
			});
		}

		// Direct redirect ke list pelaku usaha setelah sukses update
		throw redirect(303, '/dashboard/pelaku-usaha');
	}
} satisfies Actions;
