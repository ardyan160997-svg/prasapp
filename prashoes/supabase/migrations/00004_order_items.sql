-- Prashoes Order Items & Photos Schema
-- Migration 00004: order_items, order_item_photos, triggers, indexes

-- ============================
-- 1. Order Items (one row per shoe pair in an order)
-- ============================
CREATE TABLE IF NOT EXISTS order_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_number      INTEGER NOT NULL CHECK (item_number > 0),
  shoe_description TEXT NOT NULL DEFAULT '',
  service_id       UUID REFERENCES services(id) ON DELETE SET NULL,
  item_status      TEXT NOT NULL DEFAULT 'Menunggu diproses',
  notes            TEXT NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id, item_number)
);

CREATE INDEX idx_order_items_order_id ON order_items (order_id);
CREATE INDEX idx_order_items_service_id ON order_items (service_id);

-- ============================
-- 2. Order Item Photos (before-after per shoe item)
-- ============================
CREATE TABLE IF NOT EXISTS order_item_photos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id  UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  photo_type     TEXT NOT NULL CHECK (photo_type IN ('before', 'after')),
  image_url      TEXT NOT NULL,
  caption        TEXT NOT NULL DEFAULT '',
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_item_photos_item_id ON order_item_photos (order_item_id);
CREATE INDEX idx_order_item_photos_type ON order_item_photos (order_item_id, photo_type);

-- ============================
-- Updated_at trigger for order_items
-- ============================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_order_items_updated_at'
  ) THEN
    CREATE TRIGGER set_order_items_updated_at
      BEFORE UPDATE ON order_items
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;