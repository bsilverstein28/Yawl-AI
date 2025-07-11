import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createServerClient()

  try {
    // Get total counts
    const { data: searchData, error: searchError } = await supabase.from("searches").select("id", { count: "exact" })

    const { data: impressionData, error: impressionError } = await supabase
      .from("impressions")
      .select("id", { count: "exact" })

    const { data: clickData, error: clickError } = await supabase.from("clicks").select("id", { count: "exact" })

    const { data: keywordData, error: keywordError } = await supabase.from("keywords").select("id", { count: "exact" })

    // Calculate totals
    const totalSearches = searchData?.length || 0
    const totalImpressions = impressionData?.length || 0
    const totalClicks = clickData?.length || 0
    const totalKeywords = keywordData?.length || 0
    const totalRevenue = totalClicks * 0.05
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

    // Get daily stats for the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0]

    const { data: dailySearches } = await supabase
      .from("searches")
      .select("created_at")
      .gte("created_at", sevenDaysAgoStr)

    const { data: dailyImpressions } = await supabase
      .from("impressions")
      .select("created_at")
      .gte("created_at", sevenDaysAgoStr)

    const { data: dailyClicks } = await supabase.from("clicks").select("created_at").gte("created_at", sevenDaysAgoStr)

    // Group by date
    const dailyStats = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      const searchesForDay = dailySearches?.filter((s) => s.created_at.startsWith(dateStr)).length || 0
      const impressionsForDay = dailyImpressions?.filter((i) => i.created_at.startsWith(dateStr)).length || 0
      const clicksForDay = dailyClicks?.filter((c) => c.created_at.startsWith(dateStr)).length || 0

      dailyStats.push({
        date: dateStr,
        searches: searchesForDay,
        impressions: impressionsForDay,
        clicks: clicksForDay,
        revenue: clicksForDay * 0.05,
      })
    }

    // Get recent activity (last 20 items)
    const { data: recentSearches } = await supabase
      .from("searches")
      .select("query_text, created_at, user_session")
      .order("created_at", { ascending: false })
      .limit(10)

    const { data: recentImpressions } = await supabase
      .from("impressions")
      .select("keyword, created_at, user_session")
      .order("created_at", { ascending: false })
      .limit(10)

    const { data: recentClicks } = await supabase
      .from("clicks")
      .select("keyword, target_url, created_at, user_session")
      .order("created_at", { ascending: false })
      .limit(10)

    // Combine and sort recent activity
    const recentActivity = [
      ...(recentSearches?.map((s) => ({
        type: "search",
        content: s.query_text,
        timestamp: s.created_at,
        user_session: s.user_session,
      })) || []),
      ...(recentImpressions?.map((i) => ({
        type: "impression",
        content: `Keyword: ${i.keyword}`,
        timestamp: i.created_at,
        user_session: i.user_session,
      })) || []),
      ...(recentClicks?.map((c) => ({
        type: "click",
        content: `${c.keyword} → ${c.target_url}`,
        timestamp: c.created_at,
        user_session: c.user_session,
      })) || []),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20)

    // Get keyword performance
    const { data: keywordPerformance } = await supabase
      .from("keywords")
      .select(`
        id,
        keyword,
        target_url,
        active,
        impressions:impressions(count),
        clicks:clicks(count)
      `)
      .limit(10)

    const analytics = {
      totals: {
        searches: totalSearches,
        impressions: totalImpressions,
        clicks: totalClicks,
        keywords: totalKeywords,
        revenue: totalRevenue,
        ctr: ctr,
      },
      dailyStats,
      recentActivity,
      keywordPerformance:
        keywordPerformance?.map((k) => ({
          keyword: k.keyword,
          target_url: k.target_url,
          active: k.active,
          impressions: k.impressions?.length || 0,
          clicks: k.clicks?.length || 0,
          ctr: k.impressions?.length > 0 ? ((k.clicks?.length || 0) / k.impressions.length) * 100 : 0,
          revenue: (k.clicks?.length || 0) * 0.05,
        })) || [],
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
