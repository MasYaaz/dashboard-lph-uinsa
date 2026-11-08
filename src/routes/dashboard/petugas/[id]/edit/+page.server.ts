import { fail, redirect, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { sql } from '#lib/server/db.ts';
import type { PetugasField, PeranPetugas } from '#lib/types.ts';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { user } = await parent();
	if (user.role !== 'ADMINISTRASI') throw redirect(303, '/dashboard');

	const targetId = parseInt(params.id);
	if (isNaN(targetId)) throw error(404, 'ID Petugas tidak ditemukan.');

	const res = await sql<PetugasField[]>`
		SELECT id_petugas, nama_petugas, peran, kontak, is_active
		FROM petugas_field WHERE id_petugas = ${targetId} LIMIT 1
	`;

	if (res.length === 0) throw error(404, 'Petugas tidak ditemukan.');

	return { petugas: res[0] };
};

export const actions = {
	default: async ({ request, params }) => {
		const targetId = parseInt(params.id);
		const formData = await request.formData();
		const nama_petugas = formData.get('nama_petugas')?.toString().trim();
		const peran = formData.get('peran')?.toString().trim() as PeranPetugas;
		const kontak = formData.get('kontak')?.toString().trim() || null;

		if (!nama_petugas || !peran) {
			return fail(400, { error: 'Nama Lengkap Petugas dan Peran wajib diisi.' });
		}

		try {
			await sql`
				UPDATE petugas_field
				SET nama_petugas = ${nama_petugas}, peran = ${peran}, kontak = ${kontak}
				WHERE id_petugas = ${targetId}
			`;
		} catch (err) {
			console.error('Error update petugas:', err);
			return fail(500, { error: 'Gagal memperbarui data petugas.' });
		}

		throw redirect(303, '/dashboard/petugas');
	}
} satisfies Actions;
