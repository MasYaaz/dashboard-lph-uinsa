import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sql } from '#lib/server/db.ts';
import type { PelakuUsaha } from '#lib/types.ts';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	if (user.role !== 'ADMINISTRASI') {
		throw redirect(303, '/dashboard');
	}

	try {
		const result = await sql<PelakuUsaha[]>`
			SELECT
				id_daftar,
				nama_pelaku_usaha,
				jumlah_produk,
				jumlah_outlet,
				alamat_outlet,
				jarak_dari_pusat_kota,
				nama_kontak_penyelia,
				created_at
			FROM pelaku_usaha
			ORDER BY created_at DESC
			LIMIT 50
		`;

		const nextIdCode = `REG-2026-${String(result.length + 149).padStart(4, '0')}`;

		return {
			recommendedId: nextIdCode,
			pelakuUsahaList: result.map((row) => ({
				id_daftar: String(row.id_daftar),
				nama_pelaku_usaha: String(row.nama_pelaku_usaha),
				jumlah_produk: Number(row.jumlah_produk),
				jumlah_outlet: Number(row.jumlah_outlet),
				alamat_outlet: String(row.alamat_outlet),
				jarak_dari_pusat_kota: Number(row.jarak_dari_pusat_kota),
				nama_kontak_penyelia: String(row.nama_kontak_penyelia)
			}))
		};
	} catch (err) {
		console.error('Error loading data pelaku usaha:', err);
		return { recommendedId: 'REG-2026-0149', pelakuUsahaList: [] };
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

		// 1. Validasi Input Kosong (Disamakan bentuk tipe return-nya)
		if (!id_daftar || !nama_pu || !alamat_outlet || isNaN(jarak) || !kontak_penyelia) {
			return fail(400, {
				duplicateError: false,
				fieldError: undefined as { id_daftar?: string } | undefined,
				suggestedId: undefined as string | undefined,
				error: '1 kolom atau lebih perlu diperbaiki sebelum data dapat disimpan.',
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
					error: 'No ID-Daftar sudah ada dalam sistem.',
					fieldError: { id_daftar: 'No ID-Daftar sudah ada dalam sistem' },
					suggestedId: recId,
					values
				});
			}

			// 3. Database Transaction Insert
			await sql.begin(async (tx) => {
				await tx`
					INSERT INTO pelaku_usaha (
						id_daftar, nama_pelaku_usaha, jumlah_produk, jumlah_outlet, alamat_outlet, jarak_dari_pusat_kota, nama_kontak_penyelia, created_by
					) VALUES (
						${id_daftar}, ${nama_pu}, ${jumlah_produk}, ${jumlah_outlet}, ${alamat_outlet}, ${jarak}, ${kontak_penyelia}, ${userId}
					)
				`;

				await tx`
					INSERT INTO permohonan_audit (id_daftar)
					VALUES (${id_daftar})
				`;
			});

			return {
				success: true,
				duplicateError: false,
				fieldError: undefined as { id_daftar?: string } | undefined,
				suggestedId: undefined as string | undefined,
				message: `Data Pelaku Usaha ${nama_pu} (${id_daftar}) berhasil ditambahkan!`
			};
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
	}
} satisfies Actions;
