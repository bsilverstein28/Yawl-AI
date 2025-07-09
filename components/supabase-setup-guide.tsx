"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, ExternalLink, Database, CheckCircle, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SupabaseSetupGuide() {
  const { toast } = useToast()

  const copySQL = () => {
    const sqlScript = `-- COPY AND PASTE THIS ENTIRE SCRIPT INTO YOUR SUPABASE SQL EDITOR
-- This will create all analytics tables for YawlAI

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

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_analytics_search ON searches;
CREATE TRIGGER trigger_update_analytics_search AFTER INSERT ON searches FOR EACH ROW EXECUTE FUNCTION update_daily_analytics();
DROP TRIGGER IF EXISTS trigger_update_analytics_impression ON impressions;
CREATE TRIGGER trigger_update_analytics_impression AFTER INSERT ON impressions FOR EACH ROW EXECUTE FUNCTION update_daily_analytics();
DROP TRIGGER IF EXISTS trigger_update_analytics_click ON clicks;
CREATE TRIGGER trigger_update_analytics_click AFTER INSERT ON clicks FOR EACH ROW EXECUTE FUNCTION update_daily_analytics();

-- Insert initial data
INSERT INTO analytics_summary (date, total_searches, total_impressions, total_clicks, total_revenue) VALUES (CURRENT_DATE, 0, 0, 0, 0.00) ON CONFLICT (date) DO NOTHING;
INSERT INTO searches (session_id, user_session, query_text, has_files, file_count) VALUES ('session_001', 'user_001', 'What are the best Nike shoes for running?', false, 0), ('session_002', 'user_002', 'Tell me about Apple products', false, 0), ('session_003', 'user_003', 'How does Tesla autopilot work?', false, 0);
INSERT INTO impressions (keyword_id, keyword, user_session) VALUES (1, 'Nike', 'user_001'), (2, 'Apple', 'user_002'), (3, 'Tesla', 'user_003');
INSERT INTO clicks (keyword_id, keyword, user_session, target_url) VALUES (1, 'Nike', 'user_001', 'https://nike.com/special-offer'), (2, 'Apple', 'user_002', 'https://apple.com/deals');

-- Verify setup
SELECT 'Setup Complete!' as status, COUNT(*) as tables_created FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('chat_sessions', 'searches', 'token_usage', 'impressions', 'clicks', 'analytics_summary');`

    navigator.clipboard.writeText(sqlScript)
    toast({
      title: "SQL Script Copied!",
      description: "Now paste it into your Supabase SQL editor and run it.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Step-by-step instructions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <Database className="w-5 h-5 mr-2" />🚀 Set Up Analytics in Your Supabase Database
          </CardTitle>
          <CardDescription className="text-blue-700">
            Follow these steps to create the analytics tables in your actual Supabase database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <div className="font-medium">Copy the SQL Script</div>
                <div className="text-sm text-gray-600 mb-2">
                  Click the button below to copy the complete analytics setup script
                </div>
                <Button onClick={copySQL} className="bg-blue-600 hover:bg-blue-700">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy SQL Script
                </Button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <div className="font-medium">Open Supabase Dashboard</div>
                <div className="text-sm text-gray-600 mb-2">Go to your Supabase project dashboard</div>
                <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="bg-transparent">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Supabase Dashboard
                  </Button>
                </a>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <div className="font-medium">Navigate to SQL Editor</div>
                <div className="text-sm text-gray-600">
                  In your Supabase dashboard: <strong>SQL Editor</strong> → <strong>New Query</strong>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                4
              </div>
              <div className="flex-1">
                <div className="font-medium">Paste and Run</div>
                <div className="text-sm text-gray-600">
                  Paste the copied SQL script and click <strong>"Run"</strong>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                ✓
              </div>
              <div className="flex-1">
                <div className="font-medium">Verify Setup</div>
                <div className="text-sm text-gray-600">You should see "Setup Complete!" with 6 tables created</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What gets created */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            What This Script Creates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">📊 6 Analytics Tables:</h4>
              <ul className="text-sm space-y-1">
                <li>
                  • <code>chat_sessions</code> - Conversation tracking
                </li>
                <li>
                  • <code>searches</code> - User queries
                </li>
                <li>
                  • <code>token_usage</code> - AI token consumption
                </li>
                <li>
                  • <code>impressions</code> - Keyword views
                </li>
                <li>
                  • <code>clicks</code> - Link clicks
                </li>
                <li>
                  • <code>analytics_summary</code> - Daily totals
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">⚡ Performance Features:</h4>
              <ul className="text-sm space-y-1">
                <li>• 12 database indexes</li>
                <li>• 3 automatic triggers</li>
                <li>• Real-time analytics updates</li>
                <li>• Sample data for testing</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">🔧 Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>If you get permission errors:</strong>
              <div>Make sure you're using the correct Supabase project and have admin access</div>
            </div>
            <div>
              <strong>If tables already exist:</strong>
              <div>
                The script uses <code>CREATE TABLE IF NOT EXISTS</code> so it's safe to run multiple times
              </div>
            </div>
            <div>
              <strong>If keywords table doesn't exist:</strong>
              <div>Run the basic keywords setup first, then run this analytics script</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next steps */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center text-green-800">
            <ArrowRight className="w-5 h-5 mr-2" />
            After Running the Script
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              1. Refresh your analytics dashboard at <code>/dashboard</code>
            </div>
            <div>2. Test the chat to generate some analytics data</div>
            <div>3. Check that keyword impressions and clicks are being tracked</div>
            <div>4. Monitor the daily summary updates</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
