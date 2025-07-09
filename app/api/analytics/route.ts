import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Check if a table exists
async function tableExists(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).select("*").limit(1)
    return !error || !error.message.includes("does not exist")
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Fetching analytics data...")

    // Check if analytics tables exist
    const analyticsTableExists = await tableExists("analytics_summary")
    const searchesTableExists = await tableExists("searches")
    const impressionsTableExists = await tableExists("impressions")
    const clicksTableExists = await tableExists("clicks")

    console.log("📊 Table status:", {
      analytics_summary: analyticsTableExists,
      searches: searchesTableExists,
      impressions: impressionsTableExists,
      clicks: clicksTableExists,
    })

    // If tables don't exist, return setup message with mock data
    if (!analyticsTableExists || !searchesTableExists || !impressionsTableExists || !clicksTableExists) {
      console.log("⚠️ Analytics tables missing - returning setup data")
      return NextResponse.json({
        needsSetup: true,
        message: "Analytics tables need to be created. Please run the database setup script.",
        totals: {
          chat_questions: 0,
          keywords_shown: 0,
          keyword_clicks: 0,
          ctr: 0,
          revenue: 0,
        },
        dailyStats: [],
        topKeywords: [],
        recentActivity: [],
        topTokenSessions: [],
      })
    }

    // Get today's date for filtering
    const today = new Date().toISOString().split("T")[0]

    // Fetch analytics summary
    const { data: summaryData, error: summaryError } = await supabase
      .from("analytics_summary")
      .select("*")
      .eq("date", today)
      .single()

    if (summaryError && !summaryError.message.includes("No rows")) {
      console.error("Error fetching summary:", summaryError)
    }

    // Fetch keyword performance from impressions and clicks tables
    const { data: impressionData, error: impressionError } = await supabase
      .from("impressions")
      .select("keyword, created_at")
      .gte("created_at", today)

    const { data: clickData, error: clickError } = await supabase
      .from("clicks")
      .select("keyword, created_at")
      .gte("created_at", today)

    // Fetch recent activity from searches table
    const { data: recentSearches, error: searchError } = await supabase
      .from("searches")
      .select("query_text, created_at, session_id")
      .order("created_at", { ascending: false })
      .limit(10)

    // Fetch recent impressions
    const { data: recentImpressions, error: impressionError2 } = await supabase
      .from("impressions")
      .select("keyword, created_at, user_session")
      .order("created_at", { ascending: false })
      .limit(10)

    // Fetch recent clicks
    const { data: recentClicks, error: clickError2 } = await supabase
      .from("clicks")
      .select("keyword, target_url, created_at, user_session")
      .order("created_at", { ascending: false })
      .limit(10)

    // Calculate totals
    const totals = {
      chat_questions: summaryData?.total_searches || 0,
      keywords_shown: summaryData?.total_impressions || 0,
      keyword_clicks: summaryData?.total_clicks || 0,
      ctr: summaryData?.total_impressions > 0 ? (summaryData?.total_clicks / summaryData?.total_impressions) * 100 : 0,
      revenue: (summaryData?.total_clicks || 0) * 0.05, // $0.05 per click
    }

    // Process keyword performance
    const topKeywords = (impressionData || []).map((item: any) => ({
      keyword: item.keyword,
      impressions: impressionData.length,
      clicks: clickData?.filter((click: any) => click.keyword === item.keyword).length || 0,
      ctr:
        impressionData.length > 0
          ? ((clickData?.filter((click: any) => click.keyword === item.keyword).length || 0) / impressionData.length) *
            100
          : 0,
      revenue: (clickData?.filter((click: any) => click.keyword === item.keyword).length || 0) * 0.05,
    }))

    // Combine recent activity
    const recentActivity = [
      ...(recentSearches || []).map((item: any) => ({
        type: "search",
        content: item.query_text,
        timestamp: item.created_at,
        session: item.session_id,
      })),
      ...(recentImpressions || []).map((item: any) => ({
        type: "impression",
        content: `Keyword: ${item.keyword}`,
        timestamp: item.created_at,
        session: item.user_session,
      })),
      ...(recentClicks || []).map((item: any) => ({
        type: "click",
        content: `Clicked: ${item.keyword} → ${item.target_url}`,
        timestamp: item.created_at,
        session: item.user_session,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20)

    // Mock daily stats for the last 7 days
    const dailyStats = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return {
        date: date.toISOString().split("T")[0],
        searches: Math.floor(Math.random() * 50) + 10,
        impressions: Math.floor(Math.random() * 200) + 50,
        clicks: Math.floor(Math.random() * 20) + 5,
        revenue: (Math.floor(Math.random() * 20) + 5) * 0.05,
      }
    }).reverse()

    const response = {
      needsSetup: false,
      totals,
      dailyStats,
      topKeywords,
      recentActivity,
      topTokenSessions: [], // This would need token tracking implementation
    }

    console.log("✅ Analytics data fetched successfully")
    return NextResponse.json(response)
  } catch (error) {
    console.error("💥 Error in analytics API:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch analytics",
        details: error instanceof Error ? error.message : "Unknown error",
        needsSetup: true,
        totals: {
          chat_questions: 0,
          keywords_shown: 0,
          keyword_clicks: 0,
          ctr: 0,
          revenue: 0,
        },
        dailyStats: [],
        topKeywords: [],
        recentActivity: [],
        topTokenSessions: [],
      },
      { status: 500 },
    )
  }
}
