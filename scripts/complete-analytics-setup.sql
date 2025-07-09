-- COPY THIS ENTIRE SCRIPT AND PASTE IT INTO YOUR SUPABASE SQL EDITOR
-- This creates all analytics tables for YawlAI

-- 1. Chat sessions table - tracks individual conversations
CREATE TABLE IF NOT EXISTS chat_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  user_session VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Searches table - tracks each search/query
CREATE TABLE IF NOT EXISTS searches (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255),
  user_session VARCHAR(255),
  query_text TEXT,
  has_files BOOLEAN DEFAULT false,
  file_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Token usage table - tracks AI token consumption
CREATE TABLE IF NOT EXISTS token_usage (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255),
  user_session VARCHAR(255),
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  model_used VARCHAR(100) DEFAULT 'gpt-4o-mini',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Impressions table - tracks when keywords are shown
CREATE TABLE IF NOT EXISTS impressions (
  id SERIAL PRIMARY KEY,
  keyword_id INTEGER REFERENCES keywords(id) ON DELETE SET NULL,
  keyword VARCHAR(255) NOT NULL,
  user_session VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Clicks table - tracks when users click on keyword links
CREATE TABLE IF NOT EXISTS clicks (
  id SERIAL PRIMARY KEY,
  keyword_id INTEGER REFERENCES keywords(id) ON DELETE SET NULL,
  keyword VARCHAR(255) NOT NULL,
  user_session VARCHAR(255),
  target_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Analytics summary table - aggregated daily statistics
CREATE TABLE IF NOT EXISTS analytics_summary (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_searches INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_session_id ON chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_searches_session_id ON searches(session_id);
CREATE INDEX IF NOT EXISTS idx_searches_created_at ON searches(created_at);
CREATE INDEX IF NOT EXISTS idx_searches_user_session ON searches(user_session);
CREATE INDEX IF NOT EXISTS idx_token_usage_session_id ON token_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON token_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_token_usage_user_session ON token_usage(user_session);
CREATE INDEX IF NOT EXISTS idx_impressions_keyword ON impressions(keyword);
CREATE INDEX IF NOT EXISTS idx_impressions_created_at ON impressions(created_at);
CREATE INDEX IF NOT EXISTS idx_impressions_keyword_id ON impressions(keyword_id);
CREATE INDEX IF NOT EXISTS idx_clicks_keyword ON clicks(keyword);
CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_clicks_keyword_id ON clicks(keyword_id);
CREATE INDEX IF NOT EXISTS idx_analytics_summary_date ON analytics_summary(date);

-- Function to update daily analytics summary
CREATE OR REPLACE FUNCTION update_daily_analytics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO analytics_summary (date, total_searches, total_impressions, total_clicks, total_revenue, updated_at)
    VALUES (
        CURRENT_DATE,
        (SELECT COUNT(*) FROM searches WHERE DATE(created_at) = CURRENT_DATE),
        (SELECT COUNT(*) FROM impressions WHERE DATE(created_at) = CURRENT_DATE),
        (SELECT COUNT(*) FROM clicks WHERE DATE(created_at) = CURRENT_DATE),
        (SELECT COUNT(*) * 0.05 FROM clicks WHERE DATE(created_at) = CURRENT_DATE),
        NOW()
    )
    ON CONFLICT (date) 
    DO UPDATE SET
        total_searches = (SELECT COUNT(*) FROM searches WHERE DATE(created_at) = CURRENT_DATE),
        total_impressions = (SELECT COUNT(*) FROM impressions WHERE DATE(created_at) = CURRENT_DATE),
        total_clicks = (SELECT COUNT(*) FROM clicks WHERE DATE(created_at) = CURRENT_DATE),
        total_revenue = (SELECT COUNT(*) * 0.05 FROM clicks WHERE DATE(created_at) = CURRENT_DATE),
        updated_at = NOW();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update analytics summary
DROP TRIGGER IF EXISTS trigger_update_analytics_search ON searches;
CREATE TRIGGER trigger_update_analytics_search
    AFTER INSERT ON searches
    FOR EACH ROW EXECUTE FUNCTION update_daily_analytics();

DROP TRIGGER IF EXISTS trigger_update_analytics_impression ON impressions;
CREATE TRIGGER trigger_update_analytics_impression
    AFTER INSERT ON impressions
    FOR EACH ROW EXECUTE FUNCTION update_daily_analytics();

DROP TRIGGER IF EXISTS trigger_update_analytics_click ON clicks;
CREATE TRIGGER trigger_update_analytics_click
    AFTER INSERT ON clicks
    FOR EACH ROW EXECUTE FUNCTION update_daily_analytics();

-- Insert initial summary for today
INSERT INTO analytics_summary (date, total_searches, total_impressions, total_clicks, total_revenue)
VALUES (CURRENT_DATE, 0, 0, 0, 0.00)
ON CONFLICT (date) DO NOTHING;

-- Insert some sample data for testing
INSERT INTO searches (session_id, user_session, query_text, has_files, file_count) VALUES
('session_001', 'user_001', 'What are the best Nike shoes for running?', false, 0),
('session_002', 'user_002', 'Tell me about Apple products', false, 0),
('session_003', 'user_003', 'How does Tesla autopilot work?', false, 0),
('session_004', 'user_004', 'Amazon Prime benefits', false, 0),
('session_005', 'user_005', 'Google Workspace features', false, 0);

INSERT INTO impressions (keyword_id, keyword, user_session) VALUES
(1, 'Nike', 'user_001'),
(2, 'Apple', 'user_002'),
(3, 'Tesla', 'user_003'),
(4, 'Amazon', 'user_004'),
(5, 'Google', 'user_005'),
(1, 'Nike', 'user_006'),
(2, 'Apple', 'user_007');

INSERT INTO clicks (keyword_id, keyword, user_session, target_url) VALUES
(1, 'Nike', 'user_001', 'https://nike.com/special-offer'),
(2, 'Apple', 'user_002', 'https://apple.com/deals'),
(3, 'Tesla', 'user_003', 'https://tesla.com/referral');

-- Verify setup completed successfully
SELECT 
    'Analytics Setup Complete!' as status,
    COUNT(*) as tables_created 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('chat_sessions', 'searches', 'token_usage', 'impressions', 'clicks', 'analytics_summary');
