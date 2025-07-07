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

    // Update daily analytics summary with error handling
    try {
      const today = new Date().toISOString().split("T")[0]

      const { error: analyticsError } = await supabase.rpc("increment_searches", {
        p_date: today,
      })

      if (analyticsError) {
        console.error("Analytics update error:", analyticsError)
        // Don't throw error, just log it
      }
    } catch (analyticsErr) {
      console.error("Analytics RPC error:", analyticsErr)
      // Continue execution even if analytics fails
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in track-search route:", error)
    // Return success even if tracking fails to not break the chat
    return NextResponse.json({ success: true, warning: "Tracking partially failed" })
  }
}
