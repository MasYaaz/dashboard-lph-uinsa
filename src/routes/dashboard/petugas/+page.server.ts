import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sql } from '#lib/server/db.ts';
import type { PetugasField, PeranPetugas } from '#lib/types.ts';

/** Memuat daftar petugas untuk pengguna administrasi. */
export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	if (user.role !== 'ADMINISTRASI') {
		throw redirect(303, '/dashboard');
	}

	try {
		const listPetugas = await sql<PetugasField[]>`
			SELECT id_petugas, nama_petugas, peran, kontak, is_active, created_at
			FROM petugas_field
			ORDER BY created_at DESC
		`;

		return {
			petugasList: listPetugas.map((p) => ({
				id_petugas: Number(p.id_petugas),
				nama_petugas: String(p.nama_petugas),
				peran: p.peran as PeranPetugas,
				kontak: p.kontak ? String(p.kontak) : '-',
				is_active: Boolean(p.is_active),
				created_at: new Date(p.created_at).toLocaleDateString('id-ID', {
					day: 'numeric',
					month: 'short',
					year: 'numeric'
				})
			}))
		};
	} catch (err) {
		console.error('Error fetching master petugas:', err);
		return { petugasList: [] };
	}
};

export const actions = {
	/** Membalik status aktif petugas yang dipilih. */
	toggleActive: async ({ request }) => {
		const formData = await request.formData();
		const id_petugas = formData.get('id_petugas')?.toString();
		const current_status = formData.get('current_status')?.toString() === 'true';

		if (!id_petugas) {
			return fail(400, { success: false, error: 'ID Petugas tidak valid.' });
		}

		try {
			await sql`
				UPDATE petugas_field
				SET is_active = ${!current_status}
				WHERE id_petugas = ${parseInt(id_petugas)}
			`;

			return {
				success: true,
				message: `Status keaktifan petugas berhasil diubah.`
			};
		} catch (err) {
			console.error('Error toggle active petugas:', err);
			return fail(500, { success: false, error: 'Gagal mengubah status keaktifan petugas.' });
		}
	}
} satisfies Actions;
