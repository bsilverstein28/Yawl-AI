-- Fix search tracking tables and functions

-- Ensure searches table exists with correct structure
CREATE TABLE IF NOT EXISTS searches (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255),
  user_session VARCHAR(255),
  query_text TEXT,
  has_files BOOLEAN DEFAULT false,
  file_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure analytics_summary table has all required columns
ALTER TABLE analytics_summary 
ADD COLUMN IF NOT EXISTS searches INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS input_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS output_tokens INTEGER DEFAULT 0;

-- Create or replace the increment_searches function
CREATE OR REPLACE FUNCTION increment_searches(p_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO analytics_summary (keyword, date, searches, impressions, clicks, revenue, input_tokens, output_tokens)
  VALUES ('_total_', p_date, 1, 0, 0, 0.00, 0, 0)
  ON CONFLICT (keyword, date)
  DO UPDATE SET searches = analytics_summary.searches + 1;
EXCEPTION
  WHEN OTHERS THEN
    -- If there's any error, just log it and continue
    RAISE NOTICE 'Error in increment_searches: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the track_tokens function
CREATE OR REPLACE FUNCTION track_tokens(p_date DATE, p_input_tokens INTEGER, p_output_tokens INTEGER)
RETURNS VOID AS $$
BEGIN
  INSERT INTO analytics_summary (keyword, date, searches, impressions, clicks, revenue, input_tokens, output_tokens)
  VALUES ('_total_', p_date, 0, 0, 0, 0.00, p_input_tokens, p_output_tokens)
  ON CONFLICT (keyword, date)
  DO UPDATE SET 
    input_tokens = analytics_summary.input_tokens + p_input_tokens,
    output_tokens = analytics_summary.output_tokens + p_output_tokens;
EXCEPTION
  WHEN OTHERS THEN
    -- If there's any error, just log it and continue
    RAISE NOTICE 'Error in track_tokens: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_searches_session_id ON searches(session_id);
CREATE INDEX IF NOT EXISTS idx_searches_created_at ON searches(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_summary_keyword_date ON analytics_summary(keyword, date);
