import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { session_id, user_session, input_tokens, output_tokens, model_used = "gpt-4o-mini" } = body

    // Validate required fields
    if (!session_id || (!input_tokens && !output_tokens)) {
      console.error("Missing required fields for token tracking")
      return NextResponse.json({ success: true, warning: "Missing required fields" })
    }

    // Track individual token usage with error handling
    try {
      const { error: tokenError } = await supabase.from("token_usage").insert([
        {
          session_id: session_id,
          user_session: user_session || session_id,
          input_tokens: Number(input_tokens) || 0,
          output_tokens: Number(output_tokens) || 0,
          model_used: model_used,
        },
      ])

      if (tokenError) {
        console.error("Token tracking error:", tokenError)
        // Don't throw error, just log it
      }
    } catch (tokenErr) {
      console.error("Token insert error:", tokenErr)
      // Continue execution even if token tracking fails
    }

    // Update daily analytics summary with error handling
    try {
      const today = new Date().toISOString().split("T")[0]

      const { error: analyticsError } = await supabase.rpc("track_tokens", {
        p_date: today,
        p_input_tokens: Number(input_tokens) || 0,
        p_output_tokens: Number(output_tokens) || 0,
      })

      if (analyticsError) {
        console.error("Analytics token update error:", analyticsError)
        // Don't throw error, just log it
      }
    } catch (analyticsErr) {
      console.error("Analytics token RPC error:", analyticsErr)
      // Continue execution even if analytics fails
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in track-tokens route:", error)
    // Return success even if tracking fails to not break the chat
    return NextResponse.json({ success: true, warning: "Token tracking partially failed" })
  }
}
