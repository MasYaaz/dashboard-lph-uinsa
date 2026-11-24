import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** Mengarahkan pengguna ke dashboard jika sudah masuk, atau ke halaman login jika belum. */
export const load: PageServerLoad = async ({ cookies }) => {
	const userId = cookies.get('session_user_id');

	// Jika sudah login, lempar langsung ke dashboard
	if (userId) {
		throw redirect(303, '/dashboard');
	}

	// Jika belum login, alihkan ke halaman login
	throw redirect(303, '/login');
};
