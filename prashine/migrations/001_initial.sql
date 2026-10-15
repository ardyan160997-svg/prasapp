BEGIN;
CREATE TABLE IF NOT EXISTS members(
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS services(
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price_per_kg INTEGER NOT NULL CHECK(price_per_kg >= 0),
  minimum_kg NUMERIC NOT NULL DEFAULT 3 CHECK(minimum_kg > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS orders(
  id SERIAL PRIMARY KEY,
  order_code TEXT UNIQUE NOT NULL,
  member_id INTEGER REFERENCES members(id),
  service_id INTEGER REFERENCES services(id),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  pickup_at TIMESTAMPTZ NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  express BOOLEAN NOT NULL DEFAULT false,
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'diajukan',
  weight_kg NUMERIC,
  total INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_member_id_idx ON orders(member_id);
CREATE INDEX IF NOT EXISTS orders_order_code_idx ON orders(order_code);
INSERT INTO services(name,price_per_kg,minimum_kg)
SELECT * FROM (VALUES ('Cuci Kering',6000,3),('Cuci Setrika',8000,3),('Setrika Saja',5000,3)) AS seed(name,price,minimum)
WHERE NOT EXISTS(SELECT 1 FROM services);
COMMIT;
