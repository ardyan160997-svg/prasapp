BEGIN;

CREATE TABLE admin_user_permission_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  permission VARCHAR(64) NOT NULL,
  effect VARCHAR(16) NOT NULL CHECK (effect IN ('ALLOW', 'DENY')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uniq_admin_user_permission_override
  ON admin_user_permission_overrides (
    user_id,
    permission,
    COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

COMMIT;
