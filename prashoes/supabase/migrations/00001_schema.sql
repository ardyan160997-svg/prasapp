-- Prashoes Database Schema
-- Migration 00001: Core tables, constraints, and indexes

-- ============================
-- 1. Services (daftar harga / pricelist)
-- ============================
CREATE TABLE IF NOT EXISTS services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  starting_price TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_services_slug ON services (slug);

-- ============================
-- 2. Orders (tracking pesanan)
-- ============================
CREATE TABLE IF NOT EXISTS orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code  TEXT NOT NULL UNIQUE,
  status      TEXT NOT NULL DEFAULT 'Pesanan dibuat',
  customer_name TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_order_code ON orders (order_code);

-- ============================
-- 3. Pickup Requests (antar-jemput)
-- ============================
CREATE TABLE IF NOT EXISTS pickup_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  pickup_address  TEXT NOT NULL,
  shoe_quantity   INTEGER NOT NULL DEFAULT 1 CHECK (shoe_quantity > 0 AND shoe_quantity <= 20),
  service_type    TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'Menunggu konfirmasi',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================
-- 4. Promos (promo & diskon)
-- ============================
CREATE TABLE IF NOT EXISTS promos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  description    TEXT NOT NULL DEFAULT '',
  discount_label TEXT NOT NULL DEFAULT '',
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_promos_active ON promos (is_active) WHERE is_active = true;

-- ============================
-- 5. Member Benefits (keuntungan member)
-- ============================
CREATE TABLE IF NOT EXISTS member_benefits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benefit     TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================
-- 6. Gallery (before-after slider)
-- ============================
CREATE TABLE IF NOT EXISTS gallery (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  before_url  TEXT NOT NULL,
  after_url   TEXT NOT NULL,
  label       TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================
-- Updated_at trigger helper
-- ============================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_services_updated_at'
  ) THEN
    CREATE TRIGGER set_services_updated_at
      BEFORE UPDATE ON services
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_orders_updated_at'
  ) THEN
    CREATE TRIGGER set_orders_updated_at
      BEFORE UPDATE ON orders
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_pickup_requests_updated_at'
  ) THEN
    CREATE TRIGGER set_pickup_requests_updated_at
      BEFORE UPDATE ON pickup_requests
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_promos_updated_at'
  ) THEN
    CREATE TRIGGER set_promos_updated_at
      BEFORE UPDATE ON promos
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;