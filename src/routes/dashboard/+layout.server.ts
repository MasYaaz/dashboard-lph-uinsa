import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { sql } from '#lib/server/db.ts';
import type { UserResponse } from '#lib/types.ts';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const userId = cookies.get('session_user_id');

	// Jika cookie tidak ada, paksa redirect ke /login
	if (!userId) {
		throw redirect(303, '/login');
	}

	try {
		// Ambil detail profil pengguna
		const users = await sql<UserResponse[]>`
      SELECT id_user, nama_lengkap, username, role, is_active
      FROM users
      WHERE id_user = ${parseInt(userId)} AND is_active = TRUE
      LIMIT 1
    `;

		const currentUser = users[0];

		// Jika pengguna tidak ditemukan atau nonaktif
		if (!currentUser) {
			cookies.delete('session_user_id', { path: '/' });
			cookies.delete('session_user_role', { path: '/' });
			throw redirect(303, '/login');
		}

		return {
			user: currentUser
		};
	} catch (err) {
		if (err instanceof Response) throw err;

		// Reset cookie jika ada galat database
		cookies.delete('session_user_id', { path: '/' });
		cookies.delete('session_user_role', { path: '/' });
		throw redirect(303, '/login');
	}
};
