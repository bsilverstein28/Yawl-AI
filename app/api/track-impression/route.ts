import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = createServerClient()

  try {
    const { keyword, user_session } = await request.json()

    // Get keyword ID
    const { data: keywordData } = await supabase.from("keywords").select("id").eq("keyword", keyword).single()

    // Track impression
    const { error } = await supabase.from("impressions").insert([
      {
        keyword_id: keywordData?.id || null,
        keyword,
        user_session,
      },
    ])

    if (error) throw error

    // Update daily analytics summary
    const today = new Date().toISOString().split("T")[0]

    const { error: analyticsError } = await supabase.rpc("increment_impressions", {
      p_keyword: keyword,
      p_date: today,
    })

    if (analyticsError) {
      console.error("Analytics update error:", analyticsError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error tracking impression:", error)
    return NextResponse.json({ error: "Failed to track impression" }, { status: 500 })
  }
}
