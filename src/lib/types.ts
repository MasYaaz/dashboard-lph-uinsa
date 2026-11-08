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

/** Tabel `users` - Akun yang boleh login (Tanpa Email) */
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

/** Tabel `petugas_field` - Data Auditor & Dewan SyARIAH (Tanpa Login) */
export interface PetugasField {
	id_petugas: number;
	nama_petugas: string;
	kontak: string | null;
	peran: PeranPetugas;
	is_active: boolean;
	created_at: Date | string;
}

// =============================================================================
// 3. UC-01: PELAKU USAHA & PERMOHONAN (Sesuai Struktur Data Excel)
// =============================================================================

/** Tabel `pelaku_usaha` */
export interface PelakuUsaha {
	id_daftar: string; // 1. No ID-Daftar
	nama_pelaku_usaha: string; // 2. Nama Pelaku Usaha
	jumlah_produk: number; // 3. Jumlah Produk
	jumlah_outlet: number; // 4. Jumlah Outlet/Pabrik
	alamat_outlet: string; // 5. Alamat Outlet/Pabrik
	jarak_dari_pusat_kota: number; // 6. Jarak dari Pusat Kota (km)
	nama_kontak_penyelia: string; // 7. Nama & Kontak Penyelia
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
// 4. UC-02: PENUGASAN TIM AUDITOR & DEWAN SYARIAH
// =============================================================================

/** Tabel `penugasan` */
export interface Penugasan {
	id_penugasan: number;
	id_permohonan: number;
	kebutuhan_jumlah_auditor: number; // 1. Kebutuhan Jumlah Auditor
	status_penugasan: StatusPenugasan;
	assigned_by: number | null;
	created_at: Date | string;
	updated_at: Date | string;
}

/** Tabel `detail_penugasan_petugas` */
export interface DetailPenugasanPetugas {
	id_detail: number;
	id_penugasan: number;
	id_petugas: number; // Linked to petugas_field (Auditor & Dewan Syariah)
}

// =============================================================================
// 5. UC-03, UC-04, UC-05: KEUANGAN AUDIT (Sesuai Skema Transaksi Baru)
// =============================================================================

/** Tabel `keuangan_audit` */
export interface KeuanganAudit {
	id_keuangan: number;
	id_permohonan: number;
	no_invoice: string; // Nomor Invoice Penagihan
	jenis_transaksi: JenisTransaksiEnum; // Jenis Transaksi berbasis ENUM
	jumlah_uang: number; // Nominal / Jumlah Uang (Rp)
	status_keuangan: StatusKeuangan;
	catatan_revisi: string | null;
	created_by: number | null;
	verified_by: number | null;
	created_at: Date | string;
	updated_at: Date | string;
}
