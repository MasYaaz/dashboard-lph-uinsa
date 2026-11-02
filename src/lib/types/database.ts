// =============================================================================
// 1. ENUM TYPES
// =============================================================================
export type RoleLogin = 'ADMINISTRASI' | 'BENDAHARA';
export type StatusPenugasan = 'PENDING' | 'ASSIGNED' | 'REASSIGNED';
export type StatusKeuangan = 'DRAFT' | 'SIAP_VERIFIKASI' | 'DITERIMA' | 'REVISI';
export type PeranPetugas = 'AUDITOR' | 'DEWAN_SYARIAH';
export type JenisErrorImport = 'FORMAT_ERROR' | 'DUPLIKAT_ERROR';
export type AksiAuditLog = 'CREATE' | 'UPDATE' | 'DELETE';

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

/** Tabel `petugas_field` - Data Auditor & Dewan Syariah (Tanpa Login) */
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
	id_petugas: number; // 2 & 3. Linked to petugas_field (Auditor & Dewan Syariah)
}

// =============================================================================
// 5. UC-03, UC-04, UC-05: KEUANGAN AUDIT & DYNAMIC COST (Sesuai Data Excel)
// =============================================================================

/** Tabel `keuangan_audit` */
export interface KeuanganAudit {
	id_keuangan: number;
	id_permohonan: number;
	no_invoice: string; // 5. Nomor Invoice Penagihan
	biaya_transport_talangan: number; // 1. Biaya Transport utk Talangan
	biaya_uh_penginapan: number; // 2. Biaya UH + Penginapan
	total_biaya_lph: number; // 3. Total Biaya Perhitungan LPH
	biaya_input_sistem: number; // 4. Biaya yang Diinput ke Sistem
	penambahan_produk: number;
	penambahan_outlet: number;
	biaya_tambahan: number; // 6. Biaya Tambahan (Tentative Lapangan)
	total_biaya_final: number;
	status_keuangan: StatusKeuangan;
	catatan_revisi: string | null;
	created_by: number | null;
	verified_by: number | null;
	created_at: Date | string;
	updated_at: Date | string;
}

// =============================================================================
// 6. UC-06, UC-07: IMPORT LOG & LOG ARSIP
// =============================================================================

/** Tabel `import_log` */
export interface ImportLog {
	id_log: number;
	nama_berkas: string;
	baris_ke: number;
	id_daftar_input: string | null;
	jenis_error: JenisErrorImport | null;
	pesan_error: string;
	uploaded_by: number | null;
	created_at: Date | string;
}

/** Tabel `log_arsip_historis` */
export interface LogArsipHistoris<T = Record<string, unknown>> {
	id_arsip: number;
	id_user: number | null;
	nama_tabel: string;
	aksi: AksiAuditLog;
	timestamp_kejadian: Date | string;
	snapshot_data: T;
}
