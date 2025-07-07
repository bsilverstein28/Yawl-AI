import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = createServerClient()

  try {
    const { keywords } = await request.json()

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ error: "No keywords provided" }, { status: 400 })
    }

    // Validate keywords
    const validKeywords = keywords.filter((k) => k.keyword && k.target_url)

    if (validKeywords.length === 0) {
      return NextResponse.json({ error: "No valid keywords found" }, { status: 400 })
    }

    // Insert keywords in batches to handle duplicates
    const results = []
    const errors = []

    for (const keyword of validKeywords) {
      try {
        const { data, error } = await supabase
          .from("keywords")
          .upsert(
            {
              keyword: keyword.keyword,
              target_url: keyword.target_url,
              active: keyword.active ?? true,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "keyword",
            },
          )
          .select()

        if (error) {
          errors.push({ keyword: keyword.keyword, error: error.message })
        } else {
          results.push(data)
        }
      } catch (err) {
        errors.push({ keyword: keyword.keyword, error: "Failed to insert" })
      }
    }

    return NextResponse.json({
      success: true,
      inserted: results.length,
      errors: errors.length,
      errorDetails: errors,
    })
  } catch (error) {
    console.error("Error bulk uploading keywords:", error)
    return NextResponse.json({ error: "Failed to upload keywords" }, { status: 500 })
  }
}
