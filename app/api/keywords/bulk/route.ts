import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = createServerClient()

  try {
    console.log("🔄 Starting bulk keyword upload...")

    const contentType = request.headers.get("content-type") || ""

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log(`📁 Processing file: ${file.name} (${file.size} bytes)`)

    // Read file content
    const text = await file.text()
    console.log("📝 File content preview:", text.substring(0, 200))

    // Parse CSV content
    const lines = text.split("\n").filter((line) => line.trim())

    if (lines.length < 2) {
      return NextResponse.json({ error: "File must contain at least a header row and one data row" }, { status: 400 })
    }

    // Skip header row
    const dataLines = lines.slice(1)
    const keywords = []

    for (const line of dataLines) {
      if (!line.trim()) continue

      // Simple CSV parsing - handle quoted fields
      const parts = line.split(",").map((part) => part.trim().replace(/^"|"$/g, ""))

      if (parts.length >= 2) {
        const keyword = parts[0].trim()
        const target_url = parts[1].trim()

        if (keyword && target_url) {
          keywords.push({ keyword, target_url })
        }
      }
    }

    console.log(`🎯 Parsed ${keywords.length} keywords from file`)

    if (keywords.length === 0) {
      return NextResponse.json({ error: "No valid keywords found in file" }, { status: 400 })
    }

    // Get existing keywords to avoid duplicates
    const { data: existingKeywords } = await supabase.from("keywords").select("keyword")

    const existingKeywordSet = new Set(existingKeywords?.map((k) => k.keyword.toLowerCase()) || [])

    // Filter out duplicates
    const newKeywords = keywords.filter((k) => !existingKeywordSet.has(k.keyword.toLowerCase()))

    console.log(
      `✅ ${newKeywords.length} new keywords to insert (${keywords.length - newKeywords.length} duplicates skipped)`,
    )

    if (newKeywords.length === 0) {
      return NextResponse.json({
        message: "All keywords already exist in database",
        inserted: 0,
        skipped: keywords.length,
      })
    }

    // Insert new keywords
    const { data, error } = await supabase
      .from("keywords")
      .insert(
        newKeywords.map((k) => ({
          keyword: k.keyword,
          target_url: k.target_url,
          active: true,
        })),
      )
      .select()

    if (error) {
      console.error("❌ Database error:", error)
      return NextResponse.json({ error: "Failed to insert keywords" }, { status: 500 })
    }

    console.log(`🎉 Successfully inserted ${data?.length || 0} keywords`)

    return NextResponse.json({
      message: `Successfully uploaded ${data?.length || 0} keywords`,
      inserted: data?.length || 0,
      skipped: keywords.length - newKeywords.length,
    })
  } catch (error) {
    console.error("💥 Error in bulk upload:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process file",
      },
      { status: 500 },
    )
  }
}
