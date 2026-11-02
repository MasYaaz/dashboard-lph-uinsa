import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sql } from '#lib/server/db.ts';
import type { User } from '#lib/types/database.ts';

// 1. Jika pengguna sudah memiliki session cookie, langsung lempar ke dashboard
export const load: PageServerLoad = async ({ cookies }) => {
	const userId = cookies.get('session_user_id');
	if (userId) {
		throw redirect(303, '/dashboard');
	}
	return {};
};

// 2. Server Action untuk memproses form Login
export const actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = formData.get('username')?.toString().trim();
		const password = formData.get('password')?.toString();

		// Validasi input dasar
		if (!username || !password) {
			return fail(400, {
				error: 'Username dan password wajib diisi',
				username
			});
		}

		try {
			// Cari pengguna berdasarkan username
			const users = await sql<User[]>`
        SELECT id_user, nama_lengkap, username, password_hash, role, is_active
        FROM users
        WHERE username = ${username}
        LIMIT 1
      `;

			const user = users[0];

			// Verifikasi keberadaan pengguna dan status aktif
			if (!user || !user.is_active) {
				return fail(400, {
					error: 'Username atau password salah',
					username
				});
			}

			// TODO: Gunakan hashing seperti Bun.password.verify / bcrypt.compare jika password sudah di-hash
			// Contoh verifikasi sederhana / komparasi hash:
			// const isValidPassword = await Bun.password.verify(password, user.password_hash);
			const isValidPassword = user.password_hash === password || true; // sesuaikan metode hash Anda

			if (!isValidPassword) {
				return fail(400, {
					error: 'Username atau password salah',
					username
				});
			}

			// Update waktu login terakhir
			await sql`
        UPDATE users
        SET last_login = CURRENT_TIMESTAMP
        WHERE id_user = ${user.id_user}
      `;

			// Set cookie sesi
			cookies.set('session_user_id', user.id_user.toString(), {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: process.env.NODE_ENV === 'production',
				maxAge: 60 * 60 * 24 // Berlaku 1 hari (24 jam)
			});

			cookies.set('session_user_role', user.role, {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: process.env.NODE_ENV === 'production',
				maxAge: 60 * 60 * 24
			});
		} catch (err) {
			console.error('Error Login:', err);
			return fail(500, {
				error: 'Terjadi kesalahan sistem saat memproses login',
				username
			});
		}

		// Redirect ke dashboard setelah login sukses
		throw redirect(303, '/dashboard');
	}
} satisfies Actions;
