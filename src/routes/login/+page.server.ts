import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sql } from '#lib/server/db.ts';
import bcrypt from 'bcryptjs';
import type { User } from '#lib/types.ts';

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
			return fail(400, { error: 'Username dan password wajib diisi', username });
		}

		try {
			// Cari pengguna berdasarkan username
			const users = await sql<User[]>`
				SELECT id_user, nama_lengkap, username, password_hash, role, is_active
				FROM users
				WHERE username = ${username}
				LIMIT 1
			`;

			const rawUser = users[0];

			if (!rawUser) {
				return fail(400, { error: 'Username atau password salah', username });
			}

			// Mendukung pembacaan properti snake_case maupun camelCase
			const idUser = rawUser.id_user;
			const isActive = rawUser.is_active;
			const passwordHash = rawUser.password_hash;

			// Verifikasi keberadaan pengguna dan status aktif
			if (isActive !== true) {
				return fail(400, { error: 'Username atau password salah', username });
			}

			// Verifikasi password langsung menggunakan bcrypt.compare
			const isValidPassword = await bcrypt.compare(password, passwordHash);
			if (!isValidPassword) {
				return fail(400, { error: 'Username atau password salah', username });
			}

			// Update waktu login terakhir
			await sql`
				UPDATE users
				SET last_login = CURRENT_TIMESTAMP
				WHERE id_user = ${idUser}
			`;

			// Set cookie sesi (berlaku 1 hari / 24 jam)
			cookies.set('session_user_id', idUser.toString(), {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: process.env.NODE_ENV === 'production',
				maxAge: 60 * 60 * 24
			});

			cookies.set('session_user_role', rawUser.role, {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: process.env.NODE_ENV === 'production',
				maxAge: 60 * 60 * 24
			});
		} catch (err) {
			console.error('Error Login DB:', err);
			return fail(500, { error: 'Terjadi kesalahan sistem saat memproses login', username });
		}

		throw redirect(303, '/dashboard');
	}
} satisfies Actions;
