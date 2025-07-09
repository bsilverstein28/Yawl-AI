import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = createServerClient()

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Read file content
    const text = await file.text()
    console.log("File content preview:", text.substring(0, 200))

    // Parse CSV content
    const lines = text.split("\n").filter((line) => line.trim())
    if (lines.length < 2) {
      return NextResponse.json({ error: "File must contain at least a header and one data row" }, { status: 400 })
    }

    // Skip header row and parse data
    const dataLines = lines.slice(1)
    const keywords = []

    for (const line of dataLines) {
      const trimmedLine = line.trim()
      if (!trimmedLine) continue

      // Simple CSV parsing - split by comma and clean quotes
      const parts = trimmedLine.split(",")
      if (parts.length >= 2) {
        const keyword = parts[0].trim().replace(/^"|"$/g, "")
        const target_url = parts[1].trim().replace(/^"|"$/g, "")

        if (keyword && target_url) {
          keywords.push({ keyword, target_url })
        }
      }
    }

    if (keywords.length === 0) {
      return NextResponse.json({ error: "No valid keywords found in file" }, { status: 400 })
    }

    // Insert keywords one by one to handle duplicates
    let inserted = 0
    let skipped = 0
    const errors: any[] = []

    for (const keywordData of keywords) {
      try {
        // Check if keyword already exists
        const { data: existing } = await supabase
          .from("keywords")
          .select("id")
          .eq("keyword", keywordData.keyword)
          .single()

        if (existing) {
          skipped++
          continue
        }

        // Insert new keyword
        const { error } = await supabase.from("keywords").insert({
          keyword: keywordData.keyword,
          target_url: keywordData.target_url,
          is_active: true,
        })

        if (error) {
          console.error("Insert error:", error)
          errors.push({ keyword: keywordData.keyword, error: error.message })
        } else {
          inserted++
        }
      } catch (err) {
        console.error("Processing error:", err)
        errors.push({ keyword: keywordData.keyword, error: "Failed to process" })
      }
    }

    return NextResponse.json({
      success: true,
      inserted,
      skipped,
      errors: errors.length,
      errorDetails: errors,
      message: `Successfully processed ${inserted + skipped} keywords. ${inserted} added, ${skipped} skipped (duplicates).`,
    })
  } catch (error) {
    console.error("Error bulk uploading keywords:", error)
    return NextResponse.json(
      {
        error: "Failed to upload keywords",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
