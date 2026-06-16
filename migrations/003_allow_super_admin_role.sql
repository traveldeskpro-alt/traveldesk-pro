-- Allow platform-level SaaS administrators without granting agency admins
-- access to platform administration routes.
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('super_admin', 'owner', 'admin', 'manager', 'agent', 'accountant', 'viewer'));
