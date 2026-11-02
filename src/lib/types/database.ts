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

/** Tabel `users` - Akun yang boleh login (Admin & Bendahara sahaja) */
export interface User {
  id_user: number;
  nama_lengkap: string;
  username: string;
  email: string;
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
// 3. UC-01: PELAKU USAHA & PERMOHONAN
// =============================================================================

/** Tabel `pelaku_usaha` */
export interface PelakuUsaha {
  id_daftar: string;
  nama_pelaku_usaha: string;
  produk: string;
  outlet: string;
  alamat: string;
  jarak: number; // Numeric/Decimal
  kontak: string;
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
  jumlah_kebutuhan_auditor: number;
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
// 5. UC-03, UC-04, UC-05: KEUANGAN AUDIT & DYNAMIC COST
// =============================================================================

/** Tabel `keuangan_audit` */
export interface KeuanganAudit {
  id_keuangan: number;
  id_permohonan: number;
  no_invoice: string;
  biaya_transportasi: number;
  biaya_uh_penginapan: number;
  biaya_operasional_lph: number;
  penambahan_produk: number;
  penambahan_outlet: number;
  biaya_tambahan: number;
  total_biaya: number;
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
  id_arsip: number; // BigInt / BigSerial
  id_user: number | null;
  nama_tabel: string;
  aksi: AksiAuditLog;
  timestamp_kejadian: Date | string;
  snapshot_data: T;
}
