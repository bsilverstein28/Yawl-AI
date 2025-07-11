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
    console.log("🔍 Fetching real analytics data...")

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

    // If tables don't exist, return setup message
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

    // Fetch real data from all tables
    console.log("📈 Fetching real analytics data from database...")

    // Get total counts
    const { data: totalSearches, error: searchCountError } = await supabase
      .from("searches")
      .select("*", { count: "exact", head: true })

    const { data: totalImpressions, error: impressionCountError } = await supabase
      .from("impressions")
      .select("*", { count: "exact", head: true })

    const { data: totalClicks, error: clickCountError } = await supabase
      .from("clicks")
      .select("*", { count: "exact", head: true })

    // Get actual search data
    const { data: searchData, error: searchDataError } = await supabase
      .from("searches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    // Get actual impression data
    const { data: impressionData, error: impressionDataError } = await supabase
      .from("impressions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    // Get actual click data
    const { data: clickData, error: clickDataError } = await supabase
      .from("clicks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    // Get token usage data if available
    const { data: tokenData, error: tokenError } = await supabase
      .from("token_usage")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    // Calculate real totals
    const searchCount = totalSearches?.length || 0
    const impressionCount = totalImpressions?.length || 0
    const clickCount = totalClicks?.length || 0

    const totals = {
      chat_questions: searchCount,
      keywords_shown: impressionCount,
      keyword_clicks: clickCount,
      ctr: impressionCount > 0 ? (clickCount / impressionCount) * 100 : 0,
      revenue: clickCount * 0.05, // $0.05 per click
    }

    // Process keyword performance from real data
    const keywordStats = new Map()

    // Count impressions per keyword
    impressionData?.forEach((impression: any) => {
      const keyword = impression.keyword
      if (!keywordStats.has(keyword)) {
        keywordStats.set(keyword, { impressions: 0, clicks: 0 })
      }
      keywordStats.get(keyword).impressions++
    })

    // Count clicks per keyword
    clickData?.forEach((click: any) => {
      const keyword = click.keyword
      if (!keywordStats.has(keyword)) {
        keywordStats.set(keyword, { impressions: 0, clicks: 0 })
      }
      keywordStats.get(keyword).clicks++
    })

    // Convert to top keywords array
    const topKeywords = Array.from(keywordStats.entries())
      .map(([keyword, stats]: [string, any]) => ({
        keyword,
        impressions: stats.impressions,
        clicks: stats.clicks,
        ctr: stats.impressions > 0 ? (stats.clicks / stats.impressions) * 100 : 0,
        revenue: stats.clicks * 0.05,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Create real recent activity from actual data
    const recentActivity = [
      ...(searchData?.slice(0, 10).map((item: any) => ({
        type: "search",
        content: item.query_text?.substring(0, 100) + (item.query_text?.length > 100 ? "..." : ""),
        timestamp: item.created_at,
        session: item.session_id || item.user_session || "unknown",
      })) || []),
      ...(impressionData?.slice(0, 10).map((item: any) => ({
        type: "impression",
        content: `Keyword shown: ${item.keyword}`,
        timestamp: item.created_at,
        session: item.user_session || "unknown",
      })) || []),
      ...(clickData?.slice(0, 10).map((item: any) => ({
        type: "click",
        content: `Clicked: ${item.keyword} → ${item.target_url}`,
        timestamp: item.created_at,
        session: item.user_session || "unknown",
      })) || []),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20)

    // Calculate real daily stats for the last 7 days
    const dailyStats = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      const daySearches = searchData?.filter((item: any) => item.created_at?.startsWith(dateStr)).length || 0

      const dayImpressions = impressionData?.filter((item: any) => item.created_at?.startsWith(dateStr)).length || 0

      const dayClicks = clickData?.filter((item: any) => item.created_at?.startsWith(dateStr)).length || 0

      dailyStats.push({
        date: dateStr,
        searches: daySearches,
        impressions: dayImpressions,
        clicks: dayClicks,
        revenue: dayClicks * 0.05,
      })
    }

    // Process token usage sessions
    const sessionTokens = new Map()
    tokenData?.forEach((token: any) => {
      const sessionId = token.session_id || token.user_session
      if (!sessionTokens.has(sessionId)) {
        sessionTokens.set(sessionId, {
          session_id: sessionId,
          total_tokens: 0,
          message_count: 0,
          last_activity: token.created_at,
        })
      }
      const session = sessionTokens.get(sessionId)
      session.total_tokens += (token.input_tokens || 0) + (token.output_tokens || 0)
      session.message_count++
      if (token.created_at > session.last_activity) {
        session.last_activity = token.created_at
      }
    })

    const topTokenSessions = Array.from(sessionTokens.values())
      .sort((a, b) => b.total_tokens - a.total_tokens)
      .slice(0, 10)

    const response = {
      needsSetup: false,
      totals,
      dailyStats,
      topKeywords,
      recentActivity,
      topTokenSessions,
    }

    console.log("✅ Real analytics data fetched successfully:", {
      searches: searchCount,
      impressions: impressionCount,
      clicks: clickCount,
      topKeywords: topKeywords.length,
      recentActivity: recentActivity.length,
    })

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
