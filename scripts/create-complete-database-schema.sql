-- Create complete database schema for YawlAI
-- This script creates all tables and functions from scratch

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS analytics_summary CASCADE;
DROP TABLE IF EXISTS token_usage CASCADE;
DROP TABLE IF EXISTS searches CASCADE;
DROP TABLE IF EXISTS clicks CASCADE;
DROP TABLE IF EXISTS impressions CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS keywords CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS increment_searches(DATE);
DROP FUNCTION IF EXISTS increment_impressions(VARCHAR, DATE);
DROP FUNCTION IF EXISTS increment_clicks(VARCHAR, DATE);
DROP FUNCTION IF EXISTS track_tokens(DATE, INTEGER, INTEGER);

-- 1. Keywords table - stores advertising keywords and URLs
CREATE TABLE keywords (
  id SERIAL PRIMARY KEY,
  keyword VARCHAR(255) NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Chat sessions table - tracks individual conversations
CREATE TABLE chat_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  user_session VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Searches table - tracks each search/query
CREATE TABLE searches (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255),
  user_session VARCHAR(255),
  query_text TEXT,
  has_files BOOLEAN DEFAULT false,
  file_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Token usage table - tracks AI token consumption
CREATE TABLE token_usage (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255),
  user_session VARCHAR(255),
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  model_used VARCHAR(100) DEFAULT 'gpt-4o-mini',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Impressions table - tracks when keywords are shown
CREATE TABLE impressions (
  id SERIAL PRIMARY KEY,
  keyword_id INTEGER REFERENCES keywords(id) ON DELETE SET NULL,
  keyword VARCHAR(255) NOT NULL,
  user_session VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Clicks table - tracks when users click on keyword links
CREATE TABLE clicks (
  id SERIAL PRIMARY KEY,
  keyword_id INTEGER REFERENCES keywords(id) ON DELETE SET NULL,
  keyword VARCHAR(255) NOT NULL,
  user_session VARCHAR(255),
  target_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Analytics summary table - aggregated daily statistics
CREATE TABLE analytics_summary (
  id SERIAL PRIMARY KEY,
  keyword VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  searches INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0.00,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(keyword, date)
);

-- Create indexes for better performance
CREATE INDEX idx_keywords_active ON keywords(active);
CREATE INDEX idx_keywords_keyword ON keywords(keyword);

CREATE INDEX idx_chat_sessions_session_id ON chat_sessions(session_id);
CREATE INDEX idx_chat_sessions_created_at ON chat_sessions(created_at);

CREATE INDEX idx_searches_session_id ON searches(session_id);
CREATE INDEX idx_searches_created_at ON searches(created_at);
CREATE INDEX idx_searches_user_session ON searches(user_session);

CREATE INDEX idx_token_usage_session_id ON token_usage(session_id);
CREATE INDEX idx_token_usage_created_at ON token_usage(created_at);
CREATE INDEX idx_token_usage_user_session ON token_usage(user_session);

CREATE INDEX idx_impressions_keyword ON impressions(keyword);
CREATE INDEX idx_impressions_created_at ON impressions(created_at);
CREATE INDEX idx_impressions_keyword_id ON impressions(keyword_id);

CREATE INDEX idx_clicks_keyword ON clicks(keyword);
CREATE INDEX idx_clicks_created_at ON clicks(created_at);
CREATE INDEX idx_clicks_keyword_id ON clicks(keyword_id);

CREATE INDEX idx_analytics_summary_keyword_date ON analytics_summary(keyword, date);
CREATE INDEX idx_analytics_summary_date ON analytics_summary(date);
CREATE INDEX idx_analytics_summary_keyword ON analytics_summary(keyword);

-- Function to increment search count in analytics_summary
CREATE OR REPLACE FUNCTION increment_searches(p_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO analytics_summary (keyword, date, searches, impressions, clicks, revenue, input_tokens, output_tokens)
  VALUES ('_total_', p_date, 1, 0, 0, 0.00, 0, 0)
  ON CONFLICT (keyword, date)
  DO UPDATE SET 
    searches = analytics_summary.searches + 1,
    updated_at = CURRENT_TIMESTAMP;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail
    RAISE NOTICE 'Error in increment_searches: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Function to increment impressions in analytics_summary
CREATE OR REPLACE FUNCTION increment_impressions(p_keyword VARCHAR, p_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO analytics_summary (keyword, date, searches, impressions, clicks, revenue, input_tokens, output_tokens)
  VALUES (p_keyword, p_date, 0, 1, 0, 0.00, 0, 0)
  ON CONFLICT (keyword, date)
  DO UPDATE SET 
    impressions = analytics_summary.impressions + 1,
    updated_at = CURRENT_TIMESTAMP;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail
    RAISE NOTICE 'Error in increment_impressions: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Function to increment clicks in analytics_summary
CREATE OR REPLACE FUNCTION increment_clicks(p_keyword VARCHAR, p_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO analytics_summary (keyword, date, searches, impressions, clicks, revenue, input_tokens, output_tokens)
  VALUES (p_keyword, p_date, 0, 0, 1, 0.10, 0, 0) -- Assume $0.10 per click
  ON CONFLICT (keyword, date)
  DO UPDATE SET 
    clicks = analytics_summary.clicks + 1,
    revenue = analytics_summary.revenue + 0.10,
    updated_at = CURRENT_TIMESTAMP;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail
    RAISE NOTICE 'Error in increment_clicks: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Function to track token usage in analytics_summary
CREATE OR REPLACE FUNCTION track_tokens(p_date DATE, p_input_tokens INTEGER, p_output_tokens INTEGER)
RETURNS VOID AS $$
BEGIN
  INSERT INTO analytics_summary (keyword, date, searches, impressions, clicks, revenue, input_tokens, output_tokens)
  VALUES ('_total_', p_date, 0, 0, 0, 0.00, p_input_tokens, p_output_tokens)
  ON CONFLICT (keyword, date)
  DO UPDATE SET 
    input_tokens = analytics_summary.input_tokens + p_input_tokens,
    output_tokens = analytics_summary.output_tokens + p_output_tokens,
    updated_at = CURRENT_TIMESTAMP;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail
    RAISE NOTICE 'Error in track_tokens: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

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

-- Insert initial analytics summary entry for today
INSERT INTO analytics_summary (keyword, date, searches, impressions, clicks, revenue, input_tokens, output_tokens)
VALUES ('_total_', CURRENT_DATE, 0, 0, 0, 0.00, 0, 0)
ON CONFLICT (keyword, date) DO NOTHING;

-- Verify tables were created successfully
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('keywords', 'chat_sessions', 'searches', 'token_usage', 'impressions', 'clicks', 'analytics_summary');
    
    RAISE NOTICE 'Created % tables successfully', table_count;
    
    IF table_count = 7 THEN
        RAISE NOTICE 'Database schema creation completed successfully!';
    ELSE
        RAISE NOTICE 'Warning: Expected 7 tables, but found %', table_count;
    END IF;
END $$;
