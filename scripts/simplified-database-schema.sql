-- Simplified database schema - only keywords table needed
-- Remove all analytics tables and functions

-- Drop analytics tables if they exist
DROP TABLE IF EXISTS analytics_summary CASCADE;
DROP TABLE IF EXISTS token_usage CASCADE;
DROP TABLE IF EXISTS searches CASCADE;
DROP TABLE IF EXISTS clicks CASCADE;
DROP TABLE IF EXISTS impressions CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;

-- Drop analytics functions
DROP FUNCTION IF EXISTS increment_searches(DATE);
DROP FUNCTION IF EXISTS increment_impressions(VARCHAR, DATE);
DROP FUNCTION IF EXISTS increment_clicks(VARCHAR, DATE);
DROP FUNCTION IF EXISTS track_tokens(DATE, INTEGER, INTEGER);

-- Keep only the keywords table
CREATE TABLE IF NOT EXISTS keywords (
  id SERIAL PRIMARY KEY,
  keyword VARCHAR(255) NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_keywords_active ON keywords(active);
CREATE INDEX IF NOT EXISTS idx_keywords_keyword ON keywords(keyword);

-- Insert sample keywords for testing
INSERT INTO keywords (keyword, target_url, active) VALUES
('Nike', 'https://nike.com/special-offer', true),
('Apple', 'https://apple.com/deals', true),
('Tesla', 'https://tesla.com/referral', true),
('Amazon', 'https://amazon.com/prime', true),
('Google', 'https://google.com/workspace', true),
('Microsoft', 'https://microsoft.com/office365', true),
('Samsung', 'https://samsung.com/galaxy', true),
('Adobe', 'https://adobe.com/creative-cloud', true),
('Netflix', 'https://netflix.com/subscribe', true),
('Spotify', 'https://spotify.com/premium', true)
ON CONFLICT (keyword) DO NOTHING;

-- Verify table was created successfully
DO $$
BEGIN
    RAISE NOTICE 'Simplified database schema created successfully!';
    RAISE NOTICE 'Only keywords table is needed for basic functionality.';
END $$;
