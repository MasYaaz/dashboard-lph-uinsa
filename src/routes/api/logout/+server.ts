import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** Menghapus cookie sesi pengguna lalu mengarahkan ke halaman login. */
export const POST: RequestHandler = async ({ cookies }) => {
	// Bersihkan cookie sesi
	cookies.delete('session_user_id', { path: '/' });
	cookies.delete('session_user_role', { path: '/' });

	// Redirect ke halaman login
	throw redirect(303, '/login');
};
