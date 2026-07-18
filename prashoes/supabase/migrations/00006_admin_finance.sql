-- Prashoes Admin Finance Schema
-- Migration 00006: add financial tracking fields to orders

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS revenue_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS production_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS raw_material_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS finance_notes TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);