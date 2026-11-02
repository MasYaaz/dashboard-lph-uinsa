-- Insert Akun Login (Admin & Bendahara)
INSERT INTO users (nama_lengkap, username, email, password_hash, role)
VALUES
    ('Staf Admin 1', 'admin1', 'admin@sim.id', '$2b$12$hash_admin_password', 'ADMINISTRASI'),
    ('Staf Bendahara 1', 'bendahara1', 'bendahara@sim.id', '$2b$12$hash_bendahara_password', 'BENDAHARA');

-- Insert Master Data Petugas Field (Auditor & Dewan Syariah)
INSERT INTO petugas_field (nama_petugas, kontak, peran)
VALUES
    ('Dr. Ahmad Auditor', '0811111111', 'AUDITOR'),
    ('Budi Auditor, S.T.', '0822222222', 'AUDITOR'),
    ('K.H. Hasan Syariah', '0833333333', 'DEWAN_SYARIAH');

-- Query Login Verification
SELECT id_user, nama_lengkap, username, password_hash, role
FROM users
WHERE (username = 'admin1' OR email = 'admin1')
  AND is_active = TRUE;
