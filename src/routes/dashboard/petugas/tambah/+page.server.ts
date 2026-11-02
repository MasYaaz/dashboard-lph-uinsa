import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { sql } from '#lib/server/db.ts';
import type { PeranPetugas } from '#lib/types/database.ts';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	if (user.role !== 'ADMINISTRASI') throw redirect(303, '/dashboard');
	return {};
};

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const nama_petugas = formData.get('nama_petugas')?.toString().trim();
		const peran = formData.get('peran')?.toString().trim() as PeranPetugas;
		const kontak = formData.get('kontak')?.toString().trim() || null;

		if (!nama_petugas || !peran) {
			return fail(400, {
				error: 'Nama Lengkap Petugas dan Peran wajib diisi.',
				values: { nama_petugas, peran, kontak }
			});
		}

		try {
			await sql`
				INSERT INTO petugas_field (nama_petugas, peran, kontak, is_active)
				VALUES (${nama_petugas}, ${peran}, ${kontak}, TRUE)
			`;
		} catch (err) {
			console.error('Error insert petugas:', err);
			return fail(500, {
				error: 'Gagal menambahkan petugas baru ke database.',
				values: { nama_petugas, peran, kontak }
			});
		}

		throw redirect(303, '/dashboard/petugas');
	}
} satisfies Actions;
