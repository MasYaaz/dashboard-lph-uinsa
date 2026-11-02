-- Reset isi tabel users dan reset urutan ID
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- Insert 1 Admin & 1 Bendahara
INSERT INTO users (nama_lengkap, username, password_hash, role)
VALUES
    (
        'Staf Administrasi',
        'admin',
        '$2b$10$EpRnTzVlqHNP0.fKbX23D.BqX3V.v1o7GfVzP7hX1gJ5gZ5vN6aG2', -- Hash password default: admin123
        'ADMINISTRASI'
    ),
    (
        'Staf Bendahara',
        'bendahara',
        '$2b$10$EpRnTzVlqHNP0.fKbX23D.BqX3V.v1o7GfVzP7hX1gJ5gZ5vN6aG2', -- Hash password default: bendahara123
        'BENDAHARA'
    );
