-- Prashoes Admin Order History & Cashflow Schema
-- Migration 00007: add payment/promo metadata and cashflow table

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS promo_label TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS cashflow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('pemasukkan', 'pengeluaran')),
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cashflow_transactions_date ON cashflow_transactions (transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_cashflow_transactions_type ON cashflow_transactions (transaction_type);
CREATE INDEX IF NOT EXISTS idx_cashflow_transactions_order_id ON cashflow_transactions (order_id);