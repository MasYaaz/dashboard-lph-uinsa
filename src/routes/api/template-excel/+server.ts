import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const table = url.searchParams.get('table') || 'pelaku_usaha';

	let headers: string[];
	let sampleRow: string[];

	const filename = `Template_Migrasi_${table.toUpperCase()}_LPH.csv`;

	switch (table) {
		case 'permohonan_audit':
			headers = ['id_daftar', 'tanggal_permohonan'];
			sampleRow = ['REG-2026-0001', '2026-03-01'];
			break;

		case 'penugasan':
			headers = ['id_permohonan', 'kebutuhan_jumlah_auditor', 'status_penugasan'];
			sampleRow = ['1', '2', 'ASSIGNED'];
			break;

		case 'detail_penugasan_petugas':
			// Menggunakan id_daftar agar selaras dengan resolver berbasis No. Registrasi
			headers = ['id_daftar', 'id_petugas'];
			sampleRow = ['REG-2026-0001', '5'];
			break;

		case 'keuangan_audit':
			// Header disesuaikan dengan skema Header-Detail (keterangan/catatan)
			headers = [
				'id_daftar',
				'no_invoice',
				'jenis_transaksi',
				'jumlah_uang',
				'status_keuangan',
				'keterangan'
			];
			sampleRow = [
				'REG-2026-0001',
				'INV/LPH/03/2026/001',
				'TAGIHAN_FINAL',
				'3500000',
				'SIAP_VERIFIKASI',
				'Pembayaran Tahap 1'
			];
			break;

		case 'pelaku_usaha':
		default:
			headers = [
				'id_daftar',
				'nama_pelaku_usaha',
				'jumlah_produk',
				'jumlah_outlet',
				'alamat_outlet',
				'jarak_dari_pusat_kota',
				'kontak_penyelia'
			];
			sampleRow = [
				'REG-2026-0001',
				'PT Halal Barokah Utama',
				'10',
				'2',
				'Jl. Raya Darmo No. 123, Surabaya',
				'4.5',
				'081234567890'
			];
			break;
	}

	const csvContent = `${headers.join(',')}\n${sampleRow.map((val) => `"${val}"`).join(',')}`;

	return new Response(csvContent, {
		status: 200,
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};
