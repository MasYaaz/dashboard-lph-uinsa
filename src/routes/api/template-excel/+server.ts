import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const headers = [
		'id_daftar',
		'nama_pelaku_usaha',
		'jumlah_produk',
		'jumlah_outlet',
		'alamat_outlet',
		'jarak_dari_pusat_kota',
		'nama_kontak_penyelia',
		'no_invoice',
		'biaya_transport_talangan',
		'biaya_uh_penginapan',
		'total_biaya_lph',
		'biaya_input_sistem',
		'biaya_tambahan',
		'nama_auditor_utama',
		'nama_auditor_anggota',
		'nama_dewan_syariah'
	];

	const sampleRow = [
		'REG-2026-0001',
		'PT Halal Barokah Utama',
		'10',
		'2',
		'Jl. Raya Darmo No. 123, Surabaya',
		'4.5',
		'Ahmad Subagyo (081234567890)',
		'INV/LPH/2026/001',
		'150000',
		'350000',
		'1500000',
		'1500000',
		'200000',
		'Dr. H. Ahmad Fauzi, M.Si',
		'Siti Aminah, S.TP',
		'KH. Abdullah Faqih'
	];

	const csvContent = `${headers.join(',')}\n${sampleRow.map((val) => `"${val}"`).join(',')}`;

	return new Response(csvContent, {
		status: 200,
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': 'attachment; filename="Template_Migrasi_Lengkap_LPH.csv"'
		}
	});
};
