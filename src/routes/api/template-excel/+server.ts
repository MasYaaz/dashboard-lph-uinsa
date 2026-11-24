import type { RequestHandler } from './$types';

/** Menghasilkan file CSV contoh berdasarkan tabel migrasi yang diminta. */
export const GET: RequestHandler = async ({ url }) => {
	const table = url.searchParams.get('table') || 'pelaku_usaha_penugasan';

	let csvContent = '';

	if (table === 'pelaku_usaha_penugasan') {
		csvContent = [
			'id_daftar,nama_pelaku_usaha,jumlah_produk,jumlah_outlet,alamat_outlet,jarak_dari_pusat_kota,kontak_penyelia,tanggal_permohonan,tanggal_penugasan,status_penugasan,id_petugas',
			'"REG-2026-0201","CV. Berkah Jaya Pangan",12,2,"Jl. Ahmad Yani No. 117 Surabaya",2.5,"081234567890","2026-11-24","2026-11-26","ASSIGNED","1;2;4"',
			'"REG-2026-0202","PT. Sumber Makmur Sentosa",25,4,"Jl. Raya Rungkut Industri No. 45 Surabaya",8.2,"085712345678","2026-11-24","2026-11-27","ASSIGNED","1;3;5"'
		].join('\n');
	} else {
		csvContent = [
			'id_daftar,no_invoice,jenis_transaksi,jumlah_uang,status_keuangan,keterangan',
			'"REG-2026-0201","INV/2026/11/001","BIAYA_LPH",2500000,"SIAP_VERIFIKASI","Biaya pemeriksaan halal utama"',
			'"REG-2026-0201","INV/2026/11/001","TRANSPORT_TALANGAN",350000,"SIAP_VERIFIKASI","Transport tim auditor ke lokasi"',
			'"REG-2026-0201","INV/2026/11/001","UH_PENGINAPAN",500000,"SIAP_VERIFIKASI","UH & penginapan 1 malam"',
			'"REG-2026-0202","INV/2026/11/002","BIAYA_LPH",4000000,"DITERIMA","Biaya pemeriksaan 4 outlet"'
		].join('\n');
	}

	return new Response(csvContent, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="Template_Migrasi_${table.toUpperCase()}_LPH.csv"`
		}
	});
};
