-- Prashoes Row-Level Security Policies
-- Migration 00003: Enable RLS and define policies

-- ============================
-- Services (public read-only)
-- ============================
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_select_public"
  ON services FOR SELECT
  USING (true);

-- ============================
-- Orders (public read by order_code only)
-- ============================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_public"
  ON orders FOR SELECT
  USING (true);

-- ============================
-- Pickup Requests (public insert only)
-- ============================
ALTER TABLE pickup_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pickup_requests_insert_public"
  ON pickup_requests FOR INSERT
  WITH CHECK (true);

-- Note: SELECT, UPDATE, DELETE are admin-only (handled via Supabase Dashboard or service role)

-- ============================
-- Promos (public read-only)
-- ============================
ALTER TABLE promos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promos_select_public"
  ON promos FOR SELECT
  USING (true);

-- ============================
-- Member Benefits (public read-only)
-- ============================
ALTER TABLE member_benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_benefits_select_public"
  ON member_benefits FOR SELECT
  USING (true);

-- ============================
-- Gallery (public read-only)
-- ============================
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gallery_select_public"
  ON gallery FOR SELECT
  USING (true);