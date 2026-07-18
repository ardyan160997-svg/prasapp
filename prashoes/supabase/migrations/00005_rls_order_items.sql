-- Prashoes RLS Policies for Order Items & Photos
-- Migration 00005: RLS for order_items, order_item_photos, and tracking RPC

-- ============================
-- 1. order_items RLS
-- ============================
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Public can only see order_items linked to their order via order_code
-- We control this via a secure RPC function, not direct table access
-- Admin CRUD handled via service_role key

-- Block all direct public access to order_items
CREATE POLICY "order_items_no_public_select"
  ON order_items FOR SELECT
  USING (false);

CREATE POLICY "order_items_no_public_insert"
  ON order_items FOR INSERT
  WITH CHECK (false);

CREATE POLICY "order_items_no_public_update"
  ON order_items FOR UPDATE
  USING (false);

CREATE POLICY "order_items_no_public_delete"
  ON order_items FOR DELETE
  USING (false);

-- ============================
-- 2. order_item_photos RLS
-- ============================
ALTER TABLE order_item_photos ENABLE ROW LEVEL SECURITY;

-- Block all direct public access to photos (viewed through RPC only)
CREATE POLICY "order_item_photos_no_public_select"
  ON order_item_photos FOR SELECT
  USING (false);

CREATE POLICY "order_item_photos_no_public_insert"
  ON order_item_photos FOR INSERT
  WITH CHECK (false);

CREATE POLICY "order_item_photos_no_public_update"
  ON order_item_photos FOR UPDATE
  USING (false);

CREATE POLICY "order_item_photos_no_public_delete"
  ON order_item_photos FOR DELETE
  USING (false);

-- ============================
-- 3. Safe tracking RPC function
-- Returns full order details with items and photos
-- Only accessible when a valid order_code is provided
-- Does NOT expose customer_name, whatsapp_number, or pickup_address
-- ============================
CREATE OR REPLACE FUNCTION get_order_tracking(p_order_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order_id UUID;
  v_result JSONB;
BEGIN
  -- Find the order by order_code (case-insensitive)
  SELECT id INTO v_order_id
  FROM public.orders
  WHERE order_code = UPPER(TRIM(p_order_code));

  IF v_order_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Build the result JSON with order info, items, and photos
  SELECT jsonb_build_object(
    'order_code', o.order_code,
    'status', o.status,
    'created_at', o.created_at,
    'updated_at', o.updated_at,
    'items', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'item_number', oi.item_number,
          'shoe_description', oi.shoe_description,
          'service_name', s.name,
          'item_status', oi.item_status,
          'notes', oi.notes,
          'photos', COALESCE(
            (SELECT jsonb_agg(
              jsonb_build_object(
                'photo_type', oip.photo_type,
                'image_url', oip.image_url,
                'caption', oip.caption
              ) ORDER BY oip.sort_order, oip.created_at
            )
            FROM public.order_item_photos oip
            WHERE oip.order_item_id = oi.id),
            '[]'::jsonb
          )
        ) ORDER BY oi.item_number
      )
      FROM public.order_items oi
      LEFT JOIN public.services s ON s.id = oi.service_id
      WHERE oi.order_id = o.id),
      '[]'::jsonb
    )
  ) INTO v_result
  FROM public.orders o
  WHERE o.id = v_order_id;

  RETURN v_result;
END;
$$;