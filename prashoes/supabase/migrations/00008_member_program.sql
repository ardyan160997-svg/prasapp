-- Prashoes Member Program
-- Migration 00008: members table, pickup metadata, pricing fields, and helper policies

-- ============================
-- 1. Members
-- ============================
CREATE TABLE IF NOT EXISTS members (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_code             TEXT NOT NULL UNIQUE DEFAULT ('MBR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  full_name               TEXT NOT NULL,
  whatsapp_number         TEXT NOT NULL UNIQUE,
  email                   TEXT NOT NULL DEFAULT '',
  pickup_address          TEXT NOT NULL DEFAULT '',
  pickup_latitude         DOUBLE PRECISION,
  pickup_longitude        DOUBLE PRECISION,
  pickup_share_url        TEXT NOT NULL DEFAULT '',
  total_deep_clean_pairs  INTEGER NOT NULL DEFAULT 0 CHECK (total_deep_clean_pairs >= 0),
  free_wash_balance       INTEGER NOT NULL DEFAULT 0 CHECK (free_wash_balance >= 0),
  is_new_member_promo_used BOOLEAN NOT NULL DEFAULT false,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_members_member_code ON members (member_code);
CREATE INDEX IF NOT EXISTS idx_members_whatsapp_number ON members (whatsapp_number);

-- ============================
-- 2. Orders enhancements
-- ============================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS delivery_fee INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promo_label TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS final_amount INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orders_member_id ON orders (member_id);

-- ============================
-- 3. Pickup request enhancements
-- ============================
ALTER TABLE pickup_requests
  ADD COLUMN IF NOT EXISTS request_code TEXT UNIQUE DEFAULT ('PICK-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS member_code TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_member BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pickup_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS pickup_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS pickup_share_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS delivery_fee INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promo_label TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_pickup_requests_member_id ON pickup_requests (member_id);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_request_code ON pickup_requests (request_code);

-- ============================
-- 4. RLS for members
-- ============================
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'members'
      AND policyname = 'members_insert_public'
  ) THEN
    CREATE POLICY "members_insert_public"
      ON members FOR INSERT
      WITH CHECK (true);
  END IF;
END;
$$;

-- ============================
-- 5. Updated_at trigger
-- ============================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_members_updated_at'
  ) THEN
    CREATE TRIGGER set_members_updated_at
      BEFORE UPDATE ON members
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;
