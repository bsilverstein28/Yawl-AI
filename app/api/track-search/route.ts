import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { session_id, user_session, query_text, has_files = false, file_count = 0 } = body

    // Validate required fields
    if (!session_id || !query_text) {
      console.error("Missing required fields:", { session_id, query_text })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Track individual search with error handling
    try {
      const { error: searchError } = await supabase.from("searches").insert([
        {
          session_id: session_id,
          user_session: user_session || session_id,
          query_text: query_text.substring(0, 1000), // Limit text length
          has_files: Boolean(has_files),
          file_count: Number(file_count) || 0,
        },
      ])

      if (searchError) {
        console.error("Search tracking error:", searchError)
        // Don't throw error, just log it
      }
    } catch (searchErr) {
      console.error("Search insert error:", searchErr)
      // Continue execution even if search tracking fails
    }

    // Update daily analytics summary manually instead of using RPC function
    try {
      const today = new Date().toISOString().split("T")[0]

      // First, try to get existing summary for today
      const { data: existingSummary, error: fetchError } = await supabase
        .from("analytics_summary")
        .select("*")
        .eq("date", today)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching analytics summary:", fetchError)
      }

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

      if (existingSummary) {
        // Update existing summary
        const { error: updateError } = await supabase
          .from("analytics_summary")
          .update({
            total_searches: totalSearches,
            total_impressions: totalImpressions,
            total_clicks: totalClicks,
            total_revenue: totalRevenue,
            updated_at: new Date().toISOString(),
          })
          .eq("date", today)

        if (updateError) {
          console.error("Analytics update error:", updateError)
        }
      } else {
        // Insert new summary
        const { error: insertError } = await supabase.from("analytics_summary").insert([
          {
            date: today,
            total_searches: totalSearches,
            total_impressions: totalImpressions,
            total_clicks: totalClicks,
            total_revenue: totalRevenue,
          },
        ])

        if (insertError) {
          console.error("Analytics insert error:", insertError)
        }
      }
    } catch (analyticsErr) {
      console.error("Analytics update error:", analyticsErr)
      // Continue execution even if analytics fails
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in track-search route:", error)
    // Return success even if tracking fails to not break the chat
    return NextResponse.json({ success: true, warning: "Tracking partially failed" })
  }
}
