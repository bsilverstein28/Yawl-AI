import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import XLSX from "xlsx"

export async function POST(request: Request) {
  const supabase = createServerClient()

  try {
    const contentType = request.headers.get("content-type")

    let keywords: Array<{ keyword: string; target_url: string }> = []

    if (contentType?.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await request.formData()
      const file = formData.get("file") as File

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
      }

      // Validate file type
      const fileName = file.name.toLowerCase()
      if (!fileName.endsWith(".csv") && !fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
        return NextResponse.json({ error: "Invalid file type. Please upload a CSV or Excel file." }, { status: 400 })
      }

      // Read file content
      const fileContent = await file.arrayBuffer()

      if (fileName.endsWith(".csv")) {
        const text = new TextDecoder().decode(fileContent)
        console.log("File content preview:", text.substring(0, 200))

        // Parse CSV content
        const lines = text
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)

        // Skip header if it exists
        const dataLines = lines[0]?.toLowerCase().includes("keyword") ? lines.slice(1) : lines

        for (const line of dataLines) {
          if (!line.trim()) continue

          // Handle CSV parsing with quoted fields
          const parts = []
          let current = ""
          let inQuotes = false

          for (let i = 0; i < line.length; i++) {
            const char = line[i]
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === "," && !inQuotes) {
              parts.push(current.trim())
              current = ""
            } else {
              current += char
            }
          }
          parts.push(current.trim())

          if (parts.length >= 2) {
            const keyword = parts[0].replace(/^"|"$/g, "").trim()
            const target_url = parts[1].replace(/^"|"$/g, "").trim()

            if (keyword && target_url) {
              // Validate URL
              try {
                new URL(target_url)
                keywords.push({ keyword, target_url })
              } catch {
                console.warn(`Invalid URL for keyword "${keyword}": ${target_url}`)
              }
            }
          }
        }
      } else {
        // Parse Excel content
        const workbook = XLSX.read(fileContent, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        // Skip header if it exists
        const dataLines = jsonData[0]?.map((cell) => cell.toString().toLowerCase()).includes("keyword")
          ? jsonData.slice(1)
          : jsonData

        for (const line of dataLines) {
          if (!line[0] || !line[1]) continue

          const keyword = line[0].toString().trim()
          const target_url = line[1].toString().trim()

          if (keyword && target_url) {
            // Validate URL
            try {
              new URL(target_url)
              keywords.push({ keyword, target_url })
            } catch {
              console.warn(`Invalid URL for keyword "${keyword}": ${target_url}`)
            }
          }
        }
      }
    } else {
      // Handle JSON data
      const body = await request.json()
      keywords = body.keywords || []
    }

    if (keywords.length === 0) {
      return NextResponse.json({ error: "No valid keywords found" }, { status: 400 })
    }

    console.log(`Processing ${keywords.length} keywords...`)

    // Get existing keywords to avoid duplicates
    const { data: existingKeywords } = await supabase.from("keywords").select("keyword")

    const existingKeywordSet = new Set(existingKeywords?.map((k) => k.keyword.toLowerCase()) || [])

    // Filter out duplicates
    const newKeywords = keywords.filter((k) => !existingKeywordSet.has(k.keyword.toLowerCase()))

    let insertedCount = 0
    const skippedCount = keywords.length - newKeywords.length

    if (newKeywords.length > 0) {
      // Insert new keywords in batches
      const batchSize = 100
      for (let i = 0; i < newKeywords.length; i += batchSize) {
        const batch = newKeywords.slice(i, i + batchSize).map((k) => ({
          keyword: k.keyword,
          target_url: k.target_url,
          active: true,
        }))

        const { error } = await supabase.from("keywords").insert(batch)

        if (error) {
          console.error("Batch insert error:", error)
        } else {
          insertedCount += batch.length
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${keywords.length} keywords. ${insertedCount} inserted, ${skippedCount} skipped (duplicates).`,
      inserted: insertedCount,
      skipped: skippedCount,
      total: keywords.length,
    })
  } catch (error) {
    console.error("Error in bulk upload route:", error)
    return NextResponse.json({ error: "Failed to process bulk upload" }, { status: 500 })
  }
}
