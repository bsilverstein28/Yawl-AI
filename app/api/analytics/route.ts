import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = createServerClient()

  try {
    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "30")

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get summary statistics
    const { data: summaryData, error: summaryError } = await supabase
      .from("analytics_summary")
      .select("*")
      .gte("date", startDate.toISOString().split("T")[0])

    if (summaryError) throw summaryError

    // Calculate totals
    const totals = summaryData.reduce(
      (acc, row) => ({
        searches: acc.searches + (row.searches || 0),
        impressions: acc.impressions + row.impressions,
        clicks: acc.clicks + row.clicks,
        revenue: acc.revenue + row.revenue,
        input_tokens: acc.input_tokens + (row.input_tokens || 0),
        output_tokens: acc.output_tokens + (row.output_tokens || 0),
      }),
      { searches: 0, impressions: 0, clicks: 0, revenue: 0, input_tokens: 0, output_tokens: 0 },
    )

    const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0

    // Get keyword-specific stats (excluding _total_ entries)
    const keywordStats = summaryData
      .filter((row) => row.keyword !== "_total_")
      .reduce((acc: any, row) => {
        if (!acc[row.keyword]) {
          acc[row.keyword] = { keyword: row.keyword, impressions: 0, clicks: 0, revenue: 0 }
        }
        acc[row.keyword].impressions += row.impressions
        acc[row.keyword].clicks += row.clicks
        acc[row.keyword].revenue += row.revenue
        return acc
      }, {})

    const topKeywords = Object.values(keywordStats)
      .map((k: any) => ({
        ...k,
        ctr: k.impressions > 0 ? ((k.clicks / k.impressions) * 100).toFixed(2) : "0.00",
      }))
      .sort((a: any, b: any) => b.clicks - a.clicks)
      .slice(0, 10)

    // Get recent activity
    const { data: recentImpressions } = await supabase
      .from("impressions")
      .select("keyword, created_at")
      .order("created_at", { ascending: false })
      .limit(5)

    const { data: recentClicks } = await supabase
      .from("clicks")
      .select("keyword, created_at")
      .order("created_at", { ascending: false })
      .limit(5)

    const { data: recentSearches } = await supabase
      .from("searches")
      .select("query_text, has_files, file_count, created_at")
      .order("created_at", { ascending: false })
      .limit(5)

    const recentActivity = [
      ...(recentImpressions?.map((i) => ({ ...i, action: "impression" })) || []),
      ...(recentClicks?.map((c) => ({ ...c, action: "click" })) || []),
      ...(recentSearches?.map((s) => ({ ...s, action: "search", keyword: s.query_text?.substring(0, 50) + "..." })) ||
        []),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 15)

    // Get token usage per chat session
    const { data: tokenUsageData } = await supabase
      .from("token_usage")
      .select("session_id, input_tokens, output_tokens, created_at")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false })

    const sessionTokens = tokenUsageData?.reduce((acc: any, row) => {
      if (!acc[row.session_id]) {
        acc[row.session_id] = {
          session_id: row.session_id,
          input_tokens: 0,
          output_tokens: 0,
          created_at: row.created_at,
        }
      }
      acc[row.session_id].input_tokens += row.input_tokens
      acc[row.session_id].output_tokens += row.output_tokens
      return acc
    }, {})

    const topTokenSessions = Object.values(sessionTokens || {})
      .sort((a: any, b: any) => b.input_tokens + b.output_tokens - (a.input_tokens + a.output_tokens))
      .slice(0, 10)

    return NextResponse.json({
      totals: {
        ...totals,
        ctr: Number.parseFloat(ctr.toFixed(2)),
        total_tokens: totals.input_tokens + totals.output_tokens,
      },
      topKeywords,
      recentActivity,
      topTokenSessions,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
