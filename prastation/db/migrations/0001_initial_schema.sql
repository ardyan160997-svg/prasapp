BEGIN;

CREATE TABLE branches (
  id UUID PRIMARY KEY,
  code VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_users (
  id UUID PRIMARY KEY,
  branch_id UUID REFERENCES branches(id),
  username VARCHAR(60) NOT NULL UNIQUE,
  display_name VARCHAR(120) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(24) NOT NULL CHECK (role IN ('OWNER_ADMIN', 'CASHIER')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE members (
  id UUID PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES branches(id),
  member_code VARCHAR(40) NOT NULL UNIQUE,
  qr_token VARCHAR(120) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(32),
  email VARCHAR(120),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE stations (
  id UUID PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES branches(id),
  code VARCHAR(40) NOT NULL UNIQUE,
  label VARCHAR(120) NOT NULL,
  console_type VARCHAR(12) NOT NULL CHECK (console_type IN ('PS3', 'PS4', 'PS5')),
  status VARCHAR(24) NOT NULL CHECK (
    status IN ('AVAILABLE', 'IN_USE', 'RESERVED', 'EXPIRED', 'MAINTENANCE', 'OUT_OF_SERVICE')
  ),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES branches(id),
  name VARCHAR(120) NOT NULL,
  pricing_type VARCHAR(24) NOT NULL CHECK (pricing_type IN ('HOURLY', 'PACKAGE')),
  console_type VARCHAR(12),
  priority INTEGER NOT NULL DEFAULT 100,
  duration_minutes INTEGER,
  price_amount INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES branches(id),
  member_id UUID REFERENCES members(id),
  transaction_number VARCHAR(40) NOT NULL UNIQUE,
  status VARCHAR(24) NOT NULL CHECK (
    status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED', 'VOID')
  ),
  subtotal_amount INTEGER NOT NULL DEFAULT 0,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  tax_amount INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL DEFAULT 0,
  created_by_user_id UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE play_sessions (
  id UUID PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES branches(id),
  station_id UUID NOT NULL REFERENCES stations(id),
  member_id UUID REFERENCES members(id),
  transaction_id UUID REFERENCES transactions(id),
  status VARCHAR(24) NOT NULL CHECK (
    status IN ('ACTIVE', 'EXPIRED', 'COMPLETED', 'CANCELLED')
  ),
  started_at TIMESTAMPTZ NOT NULL,
  planned_end_at TIMESTAMPTZ NOT NULL,
  actual_end_at TIMESTAMPTZ,
  current_price_amount INTEGER NOT NULL DEFAULT 0,
  created_by_user_id UUID REFERENCES admin_users(id),
  ended_by_user_id UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uniq_active_play_session_per_station
  ON play_sessions(station_id)
  WHERE status IN ('ACTIVE', 'EXPIRED');

CREATE TABLE payments (
  id UUID PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  payment_method VARCHAR(24) NOT NULL CHECK (
    payment_method IN ('CASH', 'CARD', 'BANK_TRANSFER', 'EWALLET', 'OTHER')
  ),
  amount INTEGER NOT NULL,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  branch_id UUID REFERENCES branches(id),
  actor_user_id UUID REFERENCES admin_users(id),
  entity_type VARCHAR(60) NOT NULL,
  entity_id UUID,
  action VARCHAR(60) NOT NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;
