-- Table for storing TikTok OAuth tokens
CREATE TABLE IF NOT EXISTS tiktok_tokens (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  open_id TEXT,
  username TEXT DEFAULT 'TikTok',
  expires_at BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Allow service role to manage tokens
ALTER TABLE tiktok_tokens ENABLE ROW LEVEL SECURITY;

-- Only the user can read their own token status
CREATE POLICY "Users can read own token" ON tiktok_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert/update/delete
CREATE POLICY "Service role full access" ON tiktok_tokens
  FOR ALL USING (auth.role() = 'service_role');
