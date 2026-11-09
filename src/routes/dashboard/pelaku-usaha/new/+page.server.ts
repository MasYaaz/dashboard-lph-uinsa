import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sql } from '#lib/server/db.ts';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	if (user.role !== 'ADMINISTRASI') {
		throw redirect(303, '/dashboard');
	}

	try {
		const countRes = await sql`SELECT COUNT(*)::int as total FROM pelaku_usaha`;
		const nextIdCode = `REG-2026-${String(countRes[0].total + 149).padStart(4, '0')}`;
		return { recommendedId: nextIdCode };
	} catch (err) {
		console.error('Error loading recommended ID:', err);
		return { recommendedId: 'REG-2026-0149' };
	}
};

export const actions = {
	tambah: async ({ request, cookies, locals }) => {
		const formData = await request.formData();
		const id_daftar = formData.get('id_daftar')?.toString().trim();
		const nama_pu = formData.get('nama_pu')?.toString().trim();
		const jumlah_produk = parseInt(formData.get('jumlah_produk')?.toString() || '1');
		const jumlah_outlet = parseInt(formData.get('jumlah_outlet')?.toString() || '1');
		const alamat_outlet = formData.get('alamat_outlet')?.toString().trim();
		const jarak = parseFloat(formData.get('jarak')?.toString() || '0');
		const kontak_penyelia = formData.get('kontak_penyelia')?.toString().trim();

		const values = {
			id_daftar,
			nama_pu,
			jumlah_produk,
			jumlah_outlet,
			alamat_outlet,
			jarak,
			kontak_penyelia
		};
		const userIdStr =
			cookies.get('session_user_id') || (locals.user?.id_user ? String(locals.user.id_user) : null);
		const userId = userIdStr ? parseInt(userIdStr) : null;

		// 1. Validasi Input Kosong
		if (!id_daftar || !nama_pu || !alamat_outlet || isNaN(jarak) || !kontak_penyelia) {
			return fail(400, {
				duplicateError: false,
				fieldError: undefined as { id_daftar?: string } | undefined,
				suggestedId: undefined as string | undefined,
				error: 'Seluruh kolom wajib diisi dengan benar.',
				values
			});
		}

		try {
			// 2. Cek Duplikasi ID Daftar
			const existing = await sql`
				SELECT id_daftar FROM pelaku_usaha WHERE id_daftar = ${id_daftar} LIMIT 1
			`;

			if (existing.length > 0) {
				const countRes = await sql`SELECT COUNT(*)::int as total FROM pelaku_usaha`;
				const recId = `REG-2026-${String(countRes[0].total + 149).padStart(4, '0')}`;
				return fail(400, {
					duplicateError: true,
					error: 'No ID-Daftar sudah terdaftar dalam sistem.',
					fieldError: { id_daftar: 'No ID-Daftar sudah ada dalam sistem' },
					suggestedId: recId,
					values
				});
			}

			// 3. Database Transaction (Pelaku Usaha -> Permohonan Audit)
			await sql.begin(async (tx) => {
				await tx`
					INSERT INTO pelaku_usaha (
						id_daftar,
						nama_pelaku_usaha,
						jumlah_produk,
						jumlah_outlet,
						alamat_outlet,
						jarak_dari_pusat_kota,
						kontak_penyelia,
						created_by
					) VALUES (
						${id_daftar},
						${nama_pu},
						${jumlah_produk},
						${jumlah_outlet},
						${alamat_outlet},
						${jarak},
						${kontak_penyelia},
						${userId}
					)
				`;

				await tx`
					INSERT INTO permohonan_audit (id_daftar)
					VALUES (${id_daftar})
				`;
			});
		} catch (err) {
			console.error('Error insert pelaku usaha:', err);
			return fail(500, {
				duplicateError: false,
				fieldError: undefined as { id_daftar?: string } | undefined,
				suggestedId: undefined as string | undefined,
				error: 'Terjadi kesalahan sistem saat menyimpan data pelaku usaha.',
				values
			});
		}

		// Direct redirect ke list pelaku usaha setelah sukses
		throw redirect(303, '/dashboard/pelaku-usaha');
	}
} satisfies Actions;
