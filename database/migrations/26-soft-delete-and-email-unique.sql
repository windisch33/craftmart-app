-- Soft-delete support and email uniqueness for active customers
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Enforce lowercase email uniqueness among active customers only
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_email_lower_unique_active
  ON customers ((lower(email)))
  WHERE email IS NOT NULL AND is_active;

