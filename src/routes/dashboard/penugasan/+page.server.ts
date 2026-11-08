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
	nama_kontak_penyelia: string;
	tanggal_permohonan: string;
}

export interface RiwayatPenugasanItem {
	id_penugasan: number;
	id_daftar: string;
	nama_pu: string;
	tgl_penugasan: string;
	status_penugasan: string;
	tim_petugas: string;
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
				pu.nama_kontak_penyelia,
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

		// 3. Ambil riwayat penugasan yang sudah disetujui
		const riwayatPenugasanRaw = await sql`
			SELECT
				p.id_penugasan,
				pa.id_daftar,
				pu.nama_pelaku_usaha AS nama_pu,
				p.created_at AS tgl_penugasan,
				p.status_penugasan,
				(
					SELECT STRING_AGG(pf.nama_petugas || ' (' || pf.peran || ')', ', ')
					FROM detail_penugasan_petugas dp
					JOIN petugas_field pf ON dp.id_petugas = pf.id_petugas
					WHERE dp.id_penugasan = p.id_penugasan
				) AS tim_petugas
			FROM penugasan p
			JOIN permohonan_audit pa ON p.id_permohonan = pa.id_permohonan
			JOIN pelaku_usaha pu ON pa.id_daftar = pu.id_daftar
			ORDER BY p.created_at DESC
		`;

		const permohonanPending: PermohonanPendingItem[] = permohonanPendingRaw.map((row) => ({
			id_daftar: String(row.id_daftar),
			nama_pu: String(row.nama_pu),
			jumlah_produk: Number(row.jumlah_produk ?? 1),
			jumlah_outlet: Number(row.jumlah_outlet ?? 1),
			alamat_outlet: String(row.alamat_outlet ?? '-'),
			jarak_dari_pusat_kota: Number(row.jarak_dari_pusat_kota ?? 0),
			nama_kontak_penyelia: String(row.nama_kontak_penyelia ?? '-'),
			tanggal_permohonan: new Date(row.tanggal_permohonan).toLocaleDateString('id-ID', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			})
		}));

		const riwayatPenugasan: RiwayatPenugasanItem[] = riwayatPenugasanRaw.map((row) => ({
			id_penugasan: Number(row.id_penugasan),
			id_daftar: String(row.id_daftar),
			nama_pu: String(row.nama_pu),
			tgl_penugasan: new Date(row.tgl_penugasan).toLocaleDateString('id-ID'),
			status_penugasan: String(row.status_penugasan),
			tim_petugas: String(row.tim_petugas ?? '-')
		}));

		return {
			permohonanPending,
			auditorList: listPetugas.filter((p) => p.peran === 'AUDITOR'),
			dewanSyariahList: listPetugas.filter((p) => p.peran === 'DEWAN_SYARIAH'),
			riwayatPenugasan
		};
	} catch (err) {
		console.error('Error load penugasan:', err);
		return {
			permohonanPending: [],
			auditorList: [],
			dewanSyariahList: [],
			riwayatPenugasan: []
		};
	}
};

export const actions = {
	tugaskan: async ({ request, cookies, locals }) => {
		const formData = await request.formData();
		const id_daftar = formData.get('id_daftar')?.toString().trim();
		const id_auditor_utama = formData.get('id_auditor_utama')?.toString().trim();
		const id_auditor_anggota = formData.get('id_auditor_anggota')?.toString().trim();
		const id_dewan_syariah = formData.get('id_dewan_syariah')?.toString().trim();

		const values = { id_daftar, id_auditor_utama, id_auditor_anggota, id_dewan_syariah };

		if (!id_daftar || !id_auditor_utama || !id_dewan_syariah) {
			return fail(400, {
				success: false,
				error: 'Pilih Permohonan Audit, Auditor Utama, dan Dewan Syariah terlebih dahulu.',
				values
			});
		}

		if (id_auditor_utama === id_auditor_anggota) {
			return fail(400, {
				success: false,
				error: 'Auditor Utama dan Auditor Anggota tidak boleh personil yang sama.',
				values
			});
		}

		const userIdStr =
			cookies.get('session_user_id') || (locals.user?.id_user ? String(locals.user.id_user) : null);
		const currentUserId = userIdStr ? parseInt(userIdStr) : null;

		try {
			await sql.begin(async (tx) => {
				const permohonan = await tx`
					SELECT id_permohonan
					FROM permohonan_audit
					WHERE id_daftar = ${id_daftar}
					LIMIT 1
				`;

				if (permohonan.length === 0) {
					throw new Error(`Permohonan dengan ID ${id_daftar} tidak ditemukan.`);
				}

				const idPermohonan = permohonan[0].id_permohonan;
				const totalAuditor = id_auditor_anggota ? 2 : 1;

				// 1. Insert ke tabel penugasan dengan status 'ASSIGNED'
				const resPenugasan = await tx`
					INSERT INTO penugasan (id_permohonan, kebutuhan_jumlah_auditor, status_penugasan, assigned_by)
					VALUES (${idPermohonan}, ${totalAuditor}, 'ASSIGNED', ${currentUserId})
					RETURNING id_penugasan
				`;

				const idPenugasan = resPenugasan[0].id_penugasan;

				// 2. Insert Auditor Utama
				await tx`
					INSERT INTO detail_penugasan_petugas (id_penugasan, id_petugas)
					VALUES (${idPenugasan}, ${parseInt(id_auditor_utama)})
				`;

				// 3. Insert Auditor Anggota (jika ada)
				if (id_auditor_anggota) {
					await tx`
						INSERT INTO detail_penugasan_petugas (id_penugasan, id_petugas)
						VALUES (${idPenugasan}, ${parseInt(id_auditor_anggota)})
					`;
				}

				// 4. Insert Dewan Syariah
				await tx`
					INSERT INTO detail_penugasan_petugas (id_penugasan, id_petugas)
					VALUES (${idPenugasan}, ${parseInt(id_dewan_syariah)})
				`;
			});

			return {
				success: true,
				message: `Tim Field Auditor & Dewan Syariah untuk permohonan ${id_daftar} berhasil ditugaskan!`
			};
		} catch (err) {
			console.error('Error insert penugasan:', err);
			return fail(500, {
				success: false,
				error: 'Gagal menyimpan penugasan tim. Periksa kembali database.',
				values
			});
		}
	}
} satisfies Actions;
