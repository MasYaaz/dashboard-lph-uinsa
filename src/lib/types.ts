// =============================================================================
// 1. ENUM TYPES
// =============================================================================

export type RoleLogin = 'ADMINISTRASI' | 'BENDAHARA';
export type StatusPenugasan = 'PENDING' | 'ASSIGNED' | 'REASSIGNED';
export type StatusKeuangan = 'DRAFT' | 'SIAP_VERIFIKASI' | 'DITERIMA' | 'REVISI';
export type PeranPetugas = 'AUDITOR' | 'DEWAN_SYARIAH';

/** Enum Jenis Transaksi Keuangan Audit */
export type JenisTransaksiEnum =
	| 'TRANSPORT_TALANGAN'
	| 'UH_PENGINAPAN'
	| 'BIAYA_LPH'
	| 'INPUT_SISTEM'
	| 'TENTATIVE_LAPANGAN'
	| 'TAGIHAN_FINAL'
	| 'BIAYA_LAIN';

// =============================================================================
// 2. TABEL AKUN LOGIN & PETUGAS FIELD
// =============================================================================

/** Tabel `users` - Akun yang boleh login */
export interface User {
	id_user: number;
	nama_lengkap: string;
	username: string;
	password_hash: string;
	role: RoleLogin;
	is_active: boolean;
	last_login: Date | string | null;
	created_at: Date | string;
	updated_at: Date | string;
}

/** Tipe DTO untuk respon sanitasi User (tanpa password_hash) */
export type UserResponse = Omit<User, 'password_hash'>;

/** Tabel `petugas_field` - Data Auditor & Dewan Syariah */
export interface PetugasField {
	id_petugas: number;
	nama_petugas: string;
	kontak: string | null;
	peran: PeranPetugas;
	is_active: boolean;
	created_at: Date | string;
}

// =============================================================================
// 3. PELAKU USAHA & PERMOHONAN
// =============================================================================

/** Tabel `pelaku_usaha` */
export interface PelakuUsaha {
	id_daftar: string; // No ID-Daftar / No Registrasi
	nama_pelaku_usaha: string;
	jumlah_produk: number;
	jumlah_outlet: number;
	alamat_outlet: string;
	jarak_dari_pusat_kota: number; // Jarak dari Pusat Kota (km)
	kontak_penyelia: string;
	created_by: number | null;
	created_at: Date | string;
	updated_at: Date | string;
}

/** Tabel `permohonan_audit` */
export interface PermohonanAudit {
	id_permohonan: number;
	id_daftar: string;
	tanggal_permohonan: Date | string;
	created_at: Date | string;
}

// =============================================================================
// 4. PENUGASAN TIM AUDITOR & DEWAN SYARIAH
// =============================================================================

/** Tabel `penugasan` */
export interface Penugasan {
	id_penugasan: number;
	id_permohonan: number;
	kebutuhan_jumlah_auditor: number;
	status_penugasan: StatusPenugasan;
	assigned_by: number | null;
	created_at: Date | string;
	updated_at: Date | string;
}

/** Tabel `detail_penugasan_petugas` */
export interface DetailPenugasanPetugas {
	id_detail: number;
	id_penugasan: number;
	id_petugas: number;
}

// =============================================================================
// 5. KEUANGAN AUDIT (Struktur Header & Detail Item Transaksi)
// =============================================================================

/** Tabel `keuangan_audit` - Header Invoice / Tagihan Utama */
export interface KeuanganAudit {
	id_keuangan: number;
	id_permohonan: number;
	no_invoice: string; // Unique Invoice Number
	total_tagihan: number; // Akumulasi Jumlah Uang dari Seluruh Item Detail (Rp)
	status_keuangan: StatusKeuangan;
	catatan_revisi: string | null;
	created_by: number | null;
	verified_by: number | null;
	created_at: Date | string;
	updated_at: Date | string;
}

/** Tabel `detail_keuangan_audit` - Item Rincian Biaya per Invoice */
export interface DetailKeuanganAudit {
	id_detail_keuangan: number;
	id_keuangan: number; // FK ke `keuangan_audit`
	jenis_transaksi: JenisTransaksiEnum;
	keterangan: string | null;
	jumlah_uang: number; // Nominal per item transaksi (Rp)
	created_at: Date | string;
}

/** Interface Gabungan DTO Header + Detail Item Biaya (Untuk Frontend Form / Preview Edit) */
export interface KeuanganAuditWithDetails extends KeuanganAudit {
	items: DetailKeuanganAudit[];
}
