-- Prastation Seed Data
-- Migration 00002: Populate reference tables

-- ============================
-- Services (layanan/jasa)
-- ============================
INSERT INTO services (name, slug, description, starting_price, category) VALUES
  ('Recording Studio', 'recording-studio', 'Studio recording profesional dengan equipment lengkap.', 'Mulai Rp500.000/jam', 'Studio'),
  ('Rehearsal Room', 'rehearsal-room', 'Ruang latihan band/cozy dengan instrumen standar.', 'Mulai Rp150.000/jam', 'Studio'),
  ('Event Space', 'event-space', 'Ruang event multipurpose untuk workshop, gathering, launch.', 'Mulai Rp2.000.000/event', 'Event'),
  ('Photography Studio', 'photography-studio', 'Studio foto dengan lighting & backdrop profesional.', 'Mulai Rp400.000/jam', 'Studio'),
  ('Video Production', 'video-production', 'Layanan produksi video end-to-end (konsep, shoot, edit).', 'Mulai Rp3.000.000/proyek', 'Production'),
  ('Equipment Rental', 'equipment-rental', 'Sewa kamera, lighting, audio, rigging per hari.', 'Mulai Rp200.000/hari', 'Rental')
ON CONFLICT (slug) DO NOTHING;

-- ============================
-- Rooms (ruang yang bisa dibooking)
-- ============================
INSERT INTO rooms (name, slug, description, capacity, hourly_price, daily_price, amenities, images, is_active) VALUES
  ('Studio A - Recording', 'studio-a-recording', 'Recording studio utama dengan acoustic treatment premium, vocal booth terpisah, dan control room.', 6, 'Rp500.000', 'Rp3.500.000', ARRAY['Vocal Booth', 'Control Room', 'Monitors', 'Mic Collection', 'DAW Pro Tools', 'Acoustic Treatment'], ARRAY['/images/studio-a-1.jpg', '/images/studio-a-2.jpg'], true),
  ('Studio B - Rehearsal', 'studio-b-rehearsal', 'Rehearsal room cozy untuk band/solo dengan drum set, amp, dan PA system.', 8, 'Rp150.000', 'Rp1.000.000', ARRAY['Drum Set', 'Guitar Amps', 'Bass Amp', 'PA System', 'Keyboard Stand', 'AC'], ARRAY['/images/studio-b-1.jpg'], true),
  ('Event Hall', 'event-hall', 'Ruang event luas 100m2, cocok workshop, seminar, gathering, product launch.', 80, 'Rp2.000.000', 'Rp12.000.000', ARRAY['Projector', 'Sound System', 'Stage Lighting', 'AC', 'WiFi', 'Whiteboard', 'Parking'], ARRAY['/images/event-hall-1.jpg', '/images/event-hall-2.jpg'], true),
  ('Photo Studio', 'photo-studio', 'Studio fotografi dengan cyclorama, strobe lights, modifiers, dan makeup area.', 10, 'Rp400.000', 'Rp2.800.000', ARRAY['Cyclorama', 'Strobe Lights', 'Softboxes', 'Beauty Dish', 'Makeup Area', 'Changing Room', 'AC'], ARRAY['/images/photo-studio-1.jpg'], true)
ON CONFLICT (slug) DO NOTHING;

-- ============================
-- Promos
-- ============================
INSERT INTO promos (title, description, discount_label, is_active) VALUES
  ('New Member Welcome', 'Daftar member baru dapat diskon 15% untuk booking pertama.', 'Diskon 15%', true),
  ('Weekday Special', 'Booking Studio A/B Senin-Jumat jam 09-17 dapat harga spesial.', 'Harga Spesial', true),
  ('Bundle Event + Studio', 'Sewa Event Hall + Photo Studio dalam 1 hari gratis 2 jam Studio B.', 'Gratis 2 Jam', true)
ON CONFLICT DO NOTHING;

-- ============================
-- Equipment (rental items)
-- ============================
INSERT INTO equipment (name, slug, description, daily_price, category, specs, images, is_active) VALUES
  ('Sony A7IV + 24-70mm f/2.8', 'sony-a7iv-24-70', 'Kamera full-frame hybrid terbaik untuk foto & video.', 'Rp800.000', 'Kamera', '{"sensor": "Full-frame 33MP", "mount": "E-mount", "video": "4K 60p"}', ARRAY['/images/sony-a7iv.jpg'], true),
  ('Aputure LS 600d Pro', 'aputure-ls-600d', 'LED light 600W dengan output sangat tinggi untuk production.', 'Rp400.000', 'Lighting', '{"power": "600W", "cct": "2700-6500K", "cri": "96+"}', ARRAY['/images/aputure-600d.jpg'], true),
  ('DJI Ronin 4D', 'dji-ronin-4d', 'Gimbal cinema camera all-in-one 6K/8K.', 'Rp1.500.000', 'Kamera', '{"resolution": "6K/8K", "stabilization": "4-axis", "monitor": "built-in"}', ARRAY['/images/ronin-4d.jpg'], true),
  ('Shure SM7B + Cloudlifter', 'shure-sm7b-cloudlifter', 'Dynamic mic broadcast standar industri + preamp booster.', 'Rp200.000', 'Audio', '{"type": "Dynamic", "pattern": "Cardioid", "response": "50Hz-20kHz"}', ARRAY['/images/shure-sm7b.jpg'], true)
ON CONFLICT (slug) DO NOTHING;

-- ============================
-- Packages
-- ============================
INSERT INTO packages (name, slug, description, price, includes, is_active) VALUES
  ('Starter Content Pack', 'starter-content-pack', 'Paket untuk content creator pemula: 2 jam Photo Studio + 1 jam Equipment Rental.', 'Rp1.000.000', '{"photo_studio": 2, "equipment_rental": 1}', true),
  ('Band Rehearsal + Record', 'band-rehearsal-record', '3 jam Rehearsal Room + 2 jam Recording Studio B.', 'Rp1.200.000', '{"rehearsal": 3, "recording": 2}', true),
  ('Event Launch Package', 'event-launch-package', 'Full day Event Hall + Photo Studio + 1 Videographer (8 jam).', 'Rp8.000.000', '{"event_hall": 8, "photo_studio": 4, "videographer": 8}', true),
  ('Weekend Creator Retreat', 'weekend-creator-retreat', '2 hari akses penuh semua studio + equipment unlimited + konsultasi.', 'Rp5.000.000', '{"all_access": 16, "equipment_unlimited": true, "consultation": 2}', true)
ON CONFLICT (slug) DO NOTHING;

-- ============================
-- Articles
-- ============================
INSERT INTO articles (title, slug, excerpt, content, cover_image, category, tags, author, published_at, is_published) VALUES
  ('Tips Booking Studio Recording Pertama Kali', 'tips-booking-studio-recording-pertama-kali', 'Panduan lengkap persiapan sebelum recording di studio profesional.', '# Tips Booking Studio Recording Pertama Kali\n\nBooking studio recording pertama kali bisa bikin nervous. Ini panduan lengkapnya...', '/images/article-1.jpg', 'Guide', ARRAY['recording', 'studio', 'tips', 'beginner'], 'Prastation Team', now() - interval '7 days', true),
  ('5 Hal Wajib Disiapkan Sebelum Event Launching', '5-hal-wajib-disiapkan-sebelum-event-launching', 'Checklist lengkap agar event launching berjalan lancar dan berkesan.', '# 5 Hal Wajib Disiapkan Sebelum Event Launching\n\nEvent launching butuh persiapan matang. Berikut checklistnya...', '/images/article-2.jpg', 'Event', ARRAY['event', 'launching', 'checklist', 'preparation'], 'Prastation Team', now() - interval '3 days', true),
  ('Mengapa Lighting Penting di Photography Studio', 'mengapa-lighting-penting-di-photography-studio', 'Penjelasan teknis dan kreatif kenapa lighting jadi kunci foto studio.', '# Mengapa Lighting Penting di Photography Studio\n\nLighting bukan sekadar terang-gelap. Ini alasan teknis & kreatifnya...', '/images/article-3.jpg', 'Photography', ARRAY['lighting', 'photography', 'studio', 'technique'], 'Prastation Team', now() - interval '1 day', true)
ON CONFLICT (slug) DO NOTHING;

-- ============================
-- Events
-- ============================
INSERT INTO events (title, slug, description, cover_image, start_date, end_date, location, capacity, price, is_free, status) VALUES
  ('Creative Meetup #1: Content Creator Jakarta', 'creative-meetup-1-jakarta', 'Meetup bulanan untuk content creator sharing session & networking.', '/images/event-1.jpg', now() + interval '14 days', now() + interval '14 days' + interval '4 hours', 'Prastation Event Hall', 50, 'Rp150.000', false, 'published'),
  ('Workshop: Lighting Basic untuk Pemula', 'workshop-lighting-basic', 'Workshop hands-on 3 jam belajar lighting studio dari nol.', '/images/event-2.jpg', now() + interval '21 days', now() + interval '21 days' + interval '3 hours', 'Prastation Photo Studio', 15, 'Rp500.000', false, 'published'),
  ('Open House Prastation', 'open-house-prastation', 'Event gratis buka-bukaan fasilitas Prastation untuk komunitas kreatif.', '/images/event-3.jpg', now() + interval '30 days', now() + interval '30 days' + interval '6 hours', 'Prastation All Areas', 100, '', true, 'published')
ON CONFLICT (slug) DO NOTHING;

-- ============================
-- Testimonials
-- ============================
INSERT INTO testimonials (customer_name, customer_role, content, rating, avatar_url, is_featured, is_active) VALUES
  ('Andi Pratama', 'Musisi Indie', 'Studio A acoustic-nya bener-bener premium. Vocal booth isolasi sempurna, cocok banget buat recording album.', 5, '/images/testimonial-1.jpg', true, true),
  ('Sari Dewi', 'Event Organizer', 'Event Hall nyaman, AC dingin, sound system jernih. Tim Prastation bantuan setup-nya cepat & professional.', 5, '/images/testimonial-2.jpg', true, true),
  ('Budi Santoso', 'Content Creator', 'Photo Studio cyclorama-nya lebar, lighting lengkap. Cocok buat shoot produk & portrait. Worth it!', 5, '/images/testimonial-3.jpg', false, true),
  ('Maya Putri', 'Fotografer Produk', 'Equipment rental lengkap & terawat. Aputure 600d output-nya powerful banget buat video komersial.', 4, '/images/testimonial-4.jpg', false, true)
ON CONFLICT DO NOTHING;

-- ============================
-- Partners
-- ============================
INSERT INTO partners (name, logo_url, website_url, description, sort_order, is_active) VALUES
  ('Sony Indonesia', '/images/partners/sony.png', 'https://sony.co.id', 'Official imaging partner', 1, true),
  ('Aputure', '/images/partners/aputure.png', 'https://aputure.com', 'Lighting equipment partner', 2, true),
  ('DJI', '/images/partners/dji.png', 'https://dji.com', 'Gimbal & drone partner', 3, true),
  ('Shure', '/images/partners/shure.png', 'https://shure.com', 'Audio equipment partner', 4, true),
  ('Rode', '/images/partners/rode.png', 'https://rode.com', 'Microphone partner', 5, true)
ON CONFLICT DO NOTHING;

-- ============================
-- FAQs
-- ============================
INSERT INTO faqs (question, answer, category, sort_order, is_active) VALUES
  ('Bagaimana cara booking studio?', 'Booking bisa via website di halaman Booking, pilih studio, tanggal, jam, lalu isi form dan bayar DP 50%.', 'Booking', 1, true),
  ('Apakah bisa cancel/reschedule booking?', 'Bisa, minimal 24 jam sebelum jam booking untuk full refund DP. Kurang dari 24 jam DP tidak bisa dikembalikan tapi bisa reschedule 1x.', 'Booking', 2, true),
  ('Apakah equipment rental include operator?', 'Tidak, equipment rental hanya hardware. Operator/videographer/photographer booking terpisah via layanan Production.', 'Rental', 3, true),
  ('Bisa tidak bawa tim sendiri (engineer, lighting crew)?', 'Bisa, asalkan tim mengikuti SOP studio dan bertanggung jawab atas kerusakan equipment.', 'Studio', 4, true),
  ('Apakah ada paket member/bulanan?', 'Ya, ada membership Creator Pass dengan benefit: diskon 20% semua booking, priority booking, akses community event, dan konsultasi gratis bulanan.', 'Membership', 5, true),
  ('Jam operasional Prastation?', 'Senin - Minggu: 09.00 - 22.00 WIB. Di luar jam operasional bisa request dengan biaya overtime.', 'General', 6, true),
  ('Parkir tersedia?', 'Tersedia parkir motor 20 unit & mobil 8 unit di area Prastation. Gratis untuk yang booking.', 'General', 7, true)
ON CONFLICT DO NOTHING;