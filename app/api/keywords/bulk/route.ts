import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = createServerClient()

  try {
    // Check if the request contains form data (file upload) or JSON data
    const contentType = request.headers.get("content-type")

    if (contentType?.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await request.formData()
      const file = formData.get("file") as File

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
      }

      // Read file content
      const text = await file.text()
      console.log("File content:", text.substring(0, 200)) // Debug log

      // Parse CSV content
      const lines = text.split("\n").filter((line) => line.trim())
      if (lines.length < 2) {
        return NextResponse.json({ error: "File must contain at least a header and one data row" }, { status: 400 })
      }

      // Skip header row and parse data
      const dataLines = lines.slice(1)
      const keywords = dataLines
        .map((line) => {
          // Handle CSV parsing with potential commas in quoted fields
          const parts = line.split(",")
          if (parts.length < 2) return null

          const keyword = parts[0].trim().replace(/^"|"$/g, "")
          const target_url = parts[1].trim().replace(/^"|"$/g, "")

          return { keyword, target_url }
        })
        .filter((item) => item && item.keyword && item.target_url)

      if (keywords.length === 0) {
        return NextResponse.json({ error: "No valid keywords found in file" }, { status: 400 })
      }

      // Insert keywords
      let inserted = 0
      let skipped = 0
      const errors: any[] = []

      for (const keyword of keywords) {
        try {
          // Check if keyword already exists
          const { data: existing } = await supabase
            .from("keywords")
            .select("id")
            .eq("keyword", keyword.keyword)
            .single()

          if (existing) {
            skipped++
            continue
          }

          // Insert new keyword
          const { error } = await supabase.from("keywords").insert({
            keyword: keyword.keyword,
            target_url: keyword.target_url,
            is_active: true,
          })

          if (error) {
            errors.push({ keyword: keyword.keyword, error: error.message })
          } else {
            inserted++
          }
        } catch (err) {
          errors.push({ keyword: keyword.keyword, error: "Failed to insert" })
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
    } else {
      // Handle JSON data
      const body = await request.json()
      const keywords = body.keywords || []

      if (!Array.isArray(keywords) || keywords.length === 0) {
        return NextResponse.json({ error: "No keywords provided" }, { status: 400 })
      }

      // Process JSON keywords (existing logic)
      let inserted = 0
      const errors: any[] = []

      for (const keyword of keywords) {
        try {
          const { error } = await supabase.from("keywords").insert({
            keyword: keyword.keyword,
            target_url: keyword.target_url,
            is_active: keyword.active ?? true,
          })

          if (error) {
            errors.push({ keyword: keyword.keyword, error: error.message })
          } else {
            inserted++
          }
        } catch (err) {
          errors.push({ keyword: keyword.keyword, error: "Failed to insert" })
        }
      }

      return NextResponse.json({
        success: true,
        inserted,
        errors: errors.length,
        errorDetails: errors,
      })
    }
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
