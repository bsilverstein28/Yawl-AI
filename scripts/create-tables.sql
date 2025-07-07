-- Create tables for YawlAI advertising system

-- Keywords table to store advertising keywords and URLs
CREATE TABLE IF NOT EXISTS keywords (
  id SERIAL PRIMARY KEY,
  keyword VARCHAR(255) NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Impressions table to track when keywords are shown
CREATE TABLE IF NOT EXISTS impressions (
  id SERIAL PRIMARY KEY,
  keyword_id INTEGER REFERENCES keywords(id),
  keyword VARCHAR(255) NOT NULL,
  user_session VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clicks table to track when users click on keyword links
CREATE TABLE IF NOT EXISTS clicks (
  id SERIAL PRIMARY KEY,
  keyword_id INTEGER REFERENCES keywords(id),
  keyword VARCHAR(255) NOT NULL,
  user_session VARCHAR(255),
  target_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics summary table for quick reporting
CREATE TABLE IF NOT EXISTS analytics_summary (
  id SERIAL PRIMARY KEY,
  keyword VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0.00,
  UNIQUE(keyword, date)
);

-- Insert sample data
INSERT INTO keywords (keyword, target_url, active) VALUES
('Nike', 'https://nike.com/special-offer', true),
('Apple', 'https://apple.com/deals', true),
('Tesla', 'https://tesla.com/referral', true),
('Amazon', 'https://amazon.com/prime', true),
('Google', 'https://google.com/workspace', true)
ON CONFLICT (keyword) DO NOTHING;

-- Function to increment impressions in analytics_summary
CREATE OR REPLACE FUNCTION increment_impressions(p_keyword VARCHAR, p_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO analytics_summary (keyword, date, impressions, clicks, revenue)
  VALUES (p_keyword, p_date, 1, 0, 0.00)
  ON CONFLICT (keyword, date)
  DO UPDATE SET impressions = analytics_summary.impressions + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to increment clicks in analytics_summary
CREATE OR REPLACE FUNCTION increment_clicks(p_keyword VARCHAR, p_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO analytics_summary (keyword, date, impressions, clicks, revenue)
  VALUES (p_keyword, p_date, 0, 1, 0.10) -- Assume $0.10 per click
  ON CONFLICT (keyword, date)
  DO UPDATE SET 
    clicks = analytics_summary.clicks + 1,
    revenue = analytics_summary.revenue + 0.10;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_keywords_active ON keywords(active);
CREATE INDEX IF NOT EXISTS idx_impressions_keyword ON impressions(keyword);
CREATE INDEX IF NOT EXISTS idx_impressions_created_at ON impressions(created_at);
CREATE INDEX IF NOT EXISTS idx_clicks_keyword ON clicks(keyword);
CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_summary_keyword_date ON analytics_summary(keyword, date);
