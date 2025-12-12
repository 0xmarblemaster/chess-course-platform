-- FreedomPay Subscriptions Table
-- Run this in Supabase SQL Editor

-- Subscriptions table for full platform access
-- user_id is NULLABLE to allow guest checkout (payment first, account later)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pg_payment_id TEXT UNIQUE,
  pg_order_id TEXT NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 19900,
  currency TEXT DEFAULT 'KZT',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'failed')),
  payment_method TEXT,
  card_pan TEXT,
  user_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Add comment for documentation
COMMENT ON TABLE subscriptions IS 'FreedomPay payment subscriptions for full platform access';
COMMENT ON COLUMN subscriptions.status IS 'pending=awaiting payment, active=paid and valid, expired=subscription ended, cancelled=user cancelled, failed=payment failed';
COMMENT ON COLUMN subscriptions.pg_payment_id IS 'Unique payment ID from FreedomPay';
COMMENT ON COLUMN subscriptions.pg_order_id IS 'Our order ID sent to FreedomPay';
COMMENT ON COLUMN subscriptions.card_pan IS 'Masked card number (e.g., 4111****1111)';
COMMENT ON COLUMN subscriptions.user_id IS 'Can be NULL for guest checkout - linked when user creates account';
COMMENT ON COLUMN subscriptions.user_email IS 'Email used for payment - used to link subscription to account';

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscriptions (by user_id or email)
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can do everything (for API callbacks)
CREATE POLICY "Service role full access"
  ON subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow anonymous inserts for guest checkout (via service role only)
-- Guest payments are created by the API using service role

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_pg_order ON subscriptions(pg_order_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_pg_payment ON subscriptions(pg_payment_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(user_email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_email_status ON subscriptions(user_email, status);

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = check_user_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if email has active subscription (for guest checkout)
CREATE OR REPLACE FUNCTION has_active_subscription_by_email(check_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_email = check_email
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION has_active_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_active_subscription_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION has_active_subscription_by_email(TEXT) TO anon;

-- View for admin to see all subscriptions with user emails
CREATE OR REPLACE VIEW admin_subscriptions AS
SELECT
  s.*,
  u.email as user_email_from_auth
FROM subscriptions s
LEFT JOIN auth.users u ON s.user_id = u.id
ORDER BY s.created_at DESC;

-- Grant access to the view for service role
GRANT SELECT ON admin_subscriptions TO service_role;

-- Migration helper: If table already exists with NOT NULL user_id, run this:
-- ALTER TABLE subscriptions ALTER COLUMN user_id DROP NOT NULL;
-- DROP CONSTRAINT IF EXISTS subscriptions_user_id_pg_order_id_key;
