-- Prashoes Seed Data
-- Migration 00002: Populate reference tables

-- ============================
-- Services
-- ============================
INSERT INTO services (name, slug, description, starting_price) VALUES
  ('Fast Clean',       'fast-clean',       'Pembersihan cepat untuk sepatu sehari-hari. Cocok untuk perawatan rutin.',                                          'Mulai Rp25.000'),
  ('Deep Clean',       'deep-clean',       'Pembersihan menyeluruh bagian upper, midsole, outsole, dan insole.',                                              'Mulai Rp45.000'),
  ('Unyellowing',      'unyellowing',      'Perawatan khusus untuk mengembalikan warna sol yang menguning.',                                                 'Mulai Rp55.000'),
  ('Repaint',          'repaint',          'Pewarnaan ulang bagian sepatu yang sudah pudar atau tergores.',                                                   'Mulai Rp65.000'),
  ('Leather Care',     'leather-care',     'Perawatan khusus bahan kulit termasuk pembersihan, pelembap, dan proteksi.',                                     'Mulai Rp75.000'),
  ('Premium Package',  'premium-package',  'Paket lengkap: deep clean, unyellowing, repaint, dan leather care dalam satu sesi.',                               'Mulai Rp150.000')
ON CONFLICT (slug) DO NOTHING;

-- ============================
-- Orders (example tracking data)
-- ============================
INSERT INTO orders (order_code, status, customer_name) VALUES
  ('PRS001', 'Sepatu diterima dan sedang diperiksa.', 'Budi'),
  ('PRS002', 'Proses deep clean sedang berjalan.',    'Siti'),
  ('PRS003', 'Sepatu selesai dan siap diantar.',       'Ahmad')
ON CONFLICT (order_code) DO NOTHING;

-- ============================
-- Promos
-- ============================
INSERT INTO promos (title, description, discount_label) VALUES
  ('Promo Member Baru', 'Daftar sekarang dan langsung dapat diskon 10% untuk layanan pertama.', 'Diskon 10%'),
  ('Paket Teman',       'Ajak 2 teman dan dapatkan harga spesial untuk 3 sepatu sekaligus.',    'Harga Spesial')
ON CONFLICT DO NOTHING;

-- ============================
-- Member Benefits
-- ============================
INSERT INTO member_benefits (benefit, sort_order) VALUES
  ('Diskon khusus member aktif.',          1),
  ('Prioritas antrean saat periode ramai.', 2),
  ('Riwayat treatment sepatu tersimpan.',   3),
  ('Voucher ulang tahun dan promo bulanan.', 4)
ON CONFLICT DO NOTHING;