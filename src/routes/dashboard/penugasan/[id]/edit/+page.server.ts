import { fail, redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sql } from '#lib/server/db.ts';
import type { PetugasField } from '#lib/types.ts';

export interface PermohonanDetailItem {
	id_penugasan: number;
	id_daftar: string;
	nama_pu: string;
	jumlah_produk: number;
	jumlah_outlet: number;
	alamat_outlet: string;
	jarak_dari_pusat_kota: number;
	kontak_penyelia: string;
	tanggal_permohonan: string;
}

export const load: PageServerLoad = async ({ params, parent }) => {
	const { user } = await parent();
	if (user.role !== 'ADMINISTRASI') {
		throw redirect(303, '/dashboard');
	}

	const idPenugasan = parseInt(params.id);
	if (isNaN(idPenugasan)) {
		throw error(400, 'ID Penugasan tidak valid.');
	}

	try {
		// 1. Ambil detail penugasan dan permohonan audit
		const penugasanRaw = await sql`
			SELECT
				p.id_penugasan,
				pa.id_daftar,
				pu.nama_pelaku_usaha AS nama_pu,
				pu.jumlah_produk,
				pu.jumlah_outlet,
				pu.alamat_outlet,
				pu.jarak_dari_pusat_kota,
				pu.kontak_penyelia,
				pa.tanggal_permohonan
			FROM penugasan p
			JOIN permohonan_audit pa ON p.id_permohonan = pa.id_permohonan
			JOIN pelaku_usaha pu ON pa.id_daftar = pu.id_daftar
			WHERE p.id_penugasan = ${idPenugasan}
			LIMIT 1
		`;

		if (penugasanRaw.length === 0) {
			throw error(404, `Penugasan dengan ID #${idPenugasan} tidak ditemukan.`);
		}

		// 2. Ambil petugas yang saat ini sudah dialokasikan pada penugasan ini
		const assignedPetugasRaw = await sql`
			SELECT dp.id_petugas, pf.peran
			FROM detail_penugasan_petugas dp
			JOIN petugas_field pf ON dp.id_petugas = pf.id_petugas
			WHERE dp.id_penugasan = ${idPenugasan}
		`;

		// 3. Ambil master petugas field yang aktif
		const listPetugas = await sql<PetugasField[]>`
			SELECT id_petugas, nama_petugas, peran, kontak, is_active, created_at
			FROM petugas_field
			WHERE is_active = TRUE
			ORDER BY nama_petugas ASC
		`;

		const penugasanDetail: PermohonanDetailItem = {
			id_penugasan: Number(penugasanRaw[0].id_penugasan),
			id_daftar: String(penugasanRaw[0].id_daftar),
			nama_pu: String(penugasanRaw[0].nama_pu),
			jumlah_produk: Number(penugasanRaw[0].jumlah_produk ?? 1),
			jumlah_outlet: Number(penugasanRaw[0].jumlah_outlet ?? 1),
			alamat_outlet: String(penugasanRaw[0].alamat_outlet ?? '-'),
			jarak_dari_pusat_kota: Number(penugasanRaw[0].jarak_dari_pusat_kota ?? 0),
			kontak_penyelia: String(penugasanRaw[0].kontak_penyelia ?? '-'),
			tanggal_permohonan: new Date(penugasanRaw[0].tanggal_permohonan).toLocaleDateString('id-ID', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			})
		};

		const existingAuditorIds = assignedPetugasRaw
			.filter((p) => p.peran === 'AUDITOR')
			.map((p) => String(p.id_petugas));

		const existingDewanIds = assignedPetugasRaw
			.filter((p) => p.peran === 'DEWAN_SYARIAH')
			.map((p) => String(p.id_petugas));

		return {
			penugasanDetail,
			existingAuditorIds: existingAuditorIds.length > 0 ? existingAuditorIds : [''],
			existingDewanIds: existingDewanIds.length > 0 ? existingDewanIds : [''],
			auditorList: listPetugas.filter((p) => p.peran === 'AUDITOR'),
			dewanSyariahList: listPetugas.filter((p) => p.peran === 'DEWAN_SYARIAH')
		};
	} catch (err) {
		console.error('Error loading detail penugasan:', err);
		throw error(404, `Penugasan tidak ditemukan.`);
	}
};

export const actions = {
	update: async ({ request, params }) => {
		const idPenugasan = parseInt(params.id);
		const formData = await request.formData();

		const auditorIds = formData
			.getAll('id_auditor')
			.map((id) => id.toString().trim())
			.filter(Boolean);

		const dewanSyariahIds = formData
			.getAll('id_dewan_syariah')
			.map((id) => id.toString().trim())
			.filter(Boolean);

		// Validasi
		if (isNaN(idPenugasan)) {
			return fail(400, { error: 'ID Penugasan tidak valid.' });
		}
		if (auditorIds.length === 0) {
			return fail(400, { error: 'Minimal 1 orang Auditor harus dipilih.' });
		}
		if (dewanSyariahIds.length === 0) {
			return fail(400, { error: 'Minimal 1 orang Dewan Syariah harus dipilih.' });
		}

		// Validasi Duplikasi
		const allSelectedIds = [...auditorIds, ...dewanSyariahIds];
		if (allSelectedIds.length !== new Set(allSelectedIds).size) {
			return fail(400, {
				error: 'Terdapat duplikasi petugas! Satu personil tidak boleh dipilih lebih dari sekali.'
			});
		}

		try {
			await sql.begin(async (tx) => {
				// 1. Update jumlah auditor pada tabel penugasan
				await tx`
					UPDATE penugasan
					SET
						kebutuhan_jumlah_auditor = ${auditorIds.length},
						updated_at = CURRENT_TIMESTAMP
					WHERE id_penugasan = ${idPenugasan}
				`;

				// 2. Hapus detail petugas lama
				await tx`
					DELETE FROM detail_penugasan_petugas
					WHERE id_penugasan = ${idPenugasan}
				`;

				// 3. Insert ulang auditor terpilih
				for (const idAuditor of auditorIds) {
					await tx`
						INSERT INTO detail_penugasan_petugas (id_penugasan, id_petugas)
						VALUES (${idPenugasan}, ${parseInt(idAuditor)})
					`;
				}

				// 4. Insert ulang dewan syariah terpilih
				for (const idDewan of dewanSyariahIds) {
					await tx`
						INSERT INTO detail_penugasan_petugas (id_penugasan, id_petugas)
						VALUES (${idPenugasan}, ${parseInt(idDewan)})
					`;
				}
			});
		} catch (err) {
			console.error('Error updating penugasan:', err);
			return fail(500, { error: 'Terjadi kesalahan saat memperbarui penugasan tim.' });
		}

		throw redirect(303, '/dashboard/penugasan');
	}
} satisfies Actions;
