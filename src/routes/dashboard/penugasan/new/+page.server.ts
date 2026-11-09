import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sql } from '#lib/server/db.ts';
import type { PetugasField } from '#lib/types.ts';

export interface PermohonanPendingItem {
	id_daftar: string;
	nama_pu: string;
	jumlah_produk: number;
	jumlah_outlet: number;
	alamat_outlet: string;
	jarak_dari_pusat_kota: number;
	kontak_penyelia: string;
	tanggal_permohonan: string;
}

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	if (user.role !== 'ADMINISTRASI') {
		throw redirect(303, '/dashboard');
	}

	try {
		// 1. Ambil permohonan audit yang belum memiliki penugasan tim
		const permohonanPendingRaw = await sql`
			SELECT
				pa.id_daftar,
				pu.nama_pelaku_usaha AS nama_pu,
				pu.jumlah_produk,
				pu.jumlah_outlet,
				pu.alamat_outlet,
				pu.jarak_dari_pusat_kota,
				pu.kontak_penyelia,
				pa.tanggal_permohonan
			FROM permohonan_audit pa
			JOIN pelaku_usaha pu ON pa.id_daftar = pu.id_daftar
			LEFT JOIN penugasan p ON pa.id_permohonan = p.id_permohonan
			WHERE p.id_penugasan IS NULL
			ORDER BY pa.tanggal_permohonan ASC
		`;

		// 2. Ambil master petugas field aktif
		const listPetugas = await sql<PetugasField[]>`
			SELECT id_petugas, nama_petugas, peran, kontak, is_active, created_at
			FROM petugas_field
			WHERE is_active = TRUE
			ORDER BY nama_petugas ASC
		`;

		const permohonanPending: PermohonanPendingItem[] = permohonanPendingRaw.map((row) => ({
			id_daftar: String(row.id_daftar),
			nama_pu: String(row.nama_pu),
			jumlah_produk: Number(row.jumlah_produk ?? 1),
			jumlah_outlet: Number(row.jumlah_outlet ?? 1),
			alamat_outlet: String(row.alamat_outlet ?? '-'),
			jarak_dari_pusat_kota: Number(row.jarak_dari_pusat_kota ?? 0),
			kontak_penyelia: String(row.kontak_penyelia ?? '-'),
			tanggal_permohonan: new Date(row.tanggal_permohonan).toLocaleDateString('id-ID', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			})
		}));

		return {
			permohonanPending,
			auditorList: listPetugas.filter((p) => p.peran === 'AUDITOR'),
			dewanSyariahList: listPetugas.filter((p) => p.peran === 'DEWAN_SYARIAH')
		};
	} catch (err) {
		console.error('Error load penugasan new:', err);
		return {
			permohonanPending: [],
			auditorList: [],
			dewanSyariahList: []
		};
	}
};

export const actions = {
	tugaskan: async ({ request, cookies, locals }) => {
		const formData = await request.formData();
		const id_daftar = formData.get('id_daftar')?.toString().trim();

		// Mengambil seluruh id_petugas auditor dan dewan syariah yang dikirim dari form dinamis
		const auditorIds = formData
			.getAll('id_auditor')
			.map((id) => id.toString().trim())
			.filter(Boolean);

		const dewanSyariahIds = formData
			.getAll('id_dewan_syariah')
			.map((id) => id.toString().trim())
			.filter(Boolean);

		// Validasi kelengkapan data dasar
		if (!id_daftar) {
			return fail(400, { error: 'Pilih Permohonan Audit target terlebih dahulu.' });
		}
		if (auditorIds.length === 0) {
			return fail(400, { error: 'Minimal 1 orang Auditor harus dipilih.' });
		}
		if (dewanSyariahIds.length === 0) {
			return fail(400, { error: 'Minimal 1 orang Dewan Syariah harus dipilih.' });
		}

		// Validasi Duplikasi Petugas dalam satu Form
		const allSelectedIds = [...auditorIds, ...dewanSyariahIds];
		const uniqueSelectedIds = new Set(allSelectedIds);
		if (allSelectedIds.length !== uniqueSelectedIds.size) {
			return fail(400, {
				error: 'Terdapat duplikasi petugas! Satu personil tidak boleh dipilih lebih dari sekali.'
			});
		}

		const userIdStr =
			cookies.get('session_user_id') || (locals.user?.id_user ? String(locals.user.id_user) : null);
		const currentUserId = userIdStr ? parseInt(userIdStr) : null;

		try {
			await sql.begin(async (tx) => {
				const permohonan = await tx`
					SELECT id_permohonan FROM permohonan_audit WHERE id_daftar = ${id_daftar} LIMIT 1
				`;

				if (permohonan.length === 0) {
					throw new Error(`Permohonan dengan ID ${id_daftar} tidak ditemukan.`);
				}

				const idPermohonan = permohonan[0].id_permohonan;
				const totalAuditorCount = auditorIds.length;

				// 1. Insert ke tabel penugasan
				const resPenugasan = await tx`
					INSERT INTO penugasan (id_permohonan, kebutuhan_jumlah_auditor, status_penugasan, assigned_by)
					VALUES (${idPermohonan}, ${totalAuditorCount}, 'ASSIGNED', ${currentUserId})
					RETURNING id_penugasan
				`;

				const idPenugasan = resPenugasan[0].id_penugasan;

				// 2. Insert seluruh Auditor yang dipilih ke detail_penugasan_petugas
				for (const idAuditor of auditorIds) {
					await tx`
						INSERT INTO detail_penugasan_petugas (id_penugasan, id_petugas)
						VALUES (${idPenugasan}, ${parseInt(idAuditor)})
					`;
				}

				// 3. Insert seluruh Dewan Syariah yang dipilih ke detail_penugasan_petugas
				for (const idDewan of dewanSyariahIds) {
					await tx`
						INSERT INTO detail_penugasan_petugas (id_penugasan, id_petugas)
						VALUES (${idPenugasan}, ${parseInt(idDewan)})
					`;
				}
			});
		} catch (err) {
			console.error('Error insert penugasan:', err);
			return fail(500, {
				error: 'Gagal menyimpan penugasan tim. Periksa kembali koneksi database.'
			});
		}

		// Redirect langsung ke daftar riwayat penugasan setelah berhasil
		throw redirect(303, '/dashboard/penugasan');
	}
} satisfies Actions;
