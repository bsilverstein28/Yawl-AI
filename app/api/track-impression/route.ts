import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { keyword, keyword_id, user_session } = body

    // Validate required fields
    if (!keyword || !user_session) {
      console.error("Missing required fields:", { keyword, user_session })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Track impression
    try {
      const { error: impressionError } = await supabase.from("impressions").insert([
        {
          keyword_id: keyword_id || null,
          keyword: keyword,
          user_session: user_session,
        },
      ])

      if (impressionError) {
        console.error("Impression tracking error:", impressionError)
      }
    } catch (impressionErr) {
      console.error("Impression insert error:", impressionErr)
    }

    // Update daily analytics summary manually
    try {
      const today = new Date().toISOString().split("T")[0]

      // Get current counts for today
      const { data: searchCount } = await supabase
        .from("searches")
        .select("id", { count: "exact" })
        .gte("created_at", today)
        .lt("created_at", new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0])

      const { data: impressionCount } = await supabase
        .from("impressions")
        .select("id", { count: "exact" })
        .gte("created_at", today)
        .lt("created_at", new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0])

      const { data: clickCount } = await supabase
        .from("clicks")
        .select("id", { count: "exact" })
        .gte("created_at", today)
        .lt("created_at", new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0])

      const totalSearches = searchCount?.length || 0
      const totalImpressions = impressionCount?.length || 0
      const totalClicks = clickCount?.length || 0
      const totalRevenue = totalClicks * 0.05

      // Upsert analytics summary
      const { error: analyticsError } = await supabase.from("analytics_summary").upsert(
        {
          date: today,
          total_searches: totalSearches,
          total_impressions: totalImpressions,
          total_clicks: totalClicks,
          total_revenue: totalRevenue,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "date" },
      )

      if (analyticsError) {
        console.error("Analytics update error:", analyticsError)
      }
    } catch (analyticsErr) {
      console.error("Analytics update error:", analyticsErr)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in track-impression route:", error)
    return NextResponse.json({ success: true, warning: "Tracking partially failed" })
  }
}
