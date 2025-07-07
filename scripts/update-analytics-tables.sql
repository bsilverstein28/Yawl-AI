-- Update analytics tables for comprehensive tracking

-- Add new columns to existing analytics_summary table
ALTER TABLE analytics_summary 
ADD COLUMN IF NOT EXISTS searches INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS input_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS output_tokens INTEGER DEFAULT 0;

-- Create chat_sessions table to track individual conversations
CREATE TABLE IF NOT EXISTS chat_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  user_session VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create token_usage table for detailed token tracking
CREATE TABLE IF NOT EXISTS token_usage (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255),
  user_session VARCHAR(255),
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  model_used VARCHAR(100) DEFAULT 'gpt-4o-mini',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create searches table to track each search/query
CREATE TABLE IF NOT EXISTS searches (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255),
  user_session VARCHAR(255),
  query_text TEXT,
  has_files BOOLEAN DEFAULT false,
  file_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update analytics_summary functions
CREATE OR REPLACE FUNCTION increment_searches(p_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO analytics_summary (keyword, date, searches, impressions, clicks, revenue)
  VALUES ('_total_', p_date, 1, 0, 0, 0.00)
  ON CONFLICT (keyword, date)
  DO UPDATE SET searches = analytics_summary.searches + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to track token usage
CREATE OR REPLACE FUNCTION track_tokens(p_date DATE, p_input_tokens INTEGER, p_output_tokens INTEGER)
RETURNS VOID AS $$
BEGIN
  INSERT INTO analytics_summary (keyword, date, searches, impressions, clicks, revenue, input_tokens, output_tokens)
  VALUES ('_total_', p_date, 0, 0, 0, 0.00, p_input_tokens, p_output_tokens)
  ON CONFLICT (keyword, date)
  DO UPDATE SET 
    input_tokens = analytics_summary.input_tokens + p_input_tokens,
    output_tokens = analytics_summary.output_tokens + p_output_tokens;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_session_id ON chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_session_id ON token_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON token_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_searches_session_id ON searches(session_id);
CREATE INDEX IF NOT EXISTS idx_searches_created_at ON searches(created_at);
