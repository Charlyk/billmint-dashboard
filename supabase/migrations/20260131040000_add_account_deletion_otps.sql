-- Account deletion OTP tokens table
CREATE TABLE IF NOT EXISTS account_deletion_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_account_deletion_otps_user_id ON account_deletion_otps(user_id);
CREATE INDEX idx_account_deletion_otps_otp_code ON account_deletion_otps(otp_code);

-- RLS policies
ALTER TABLE account_deletion_otps ENABLE ROW LEVEL SECURITY;

-- Allow all for service operations (accessed via admin client)
CREATE POLICY "Allow all for service operations" ON account_deletion_otps
  FOR ALL
  USING (true)
  WITH CHECK (true);
