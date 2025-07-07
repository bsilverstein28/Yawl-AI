// Fetch and process the brand CSV file
async function fetchAndProcessBrandCSV() {
  try {
    console.log("📥 Fetching brand CSV file...")

    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Brand%20test%20-%20Sheet1-ICvpqRd9AXv7bGRGR7thTZsUxktsg4.csv",
    )
    const csvText = await response.text()

    console.log("✅ CSV file fetched successfully")
    console.log(`📊 File size: ${csvText.length} characters`)

    // Parse CSV data
    const lines = csvText.split("\n").filter((line) => line.trim())
    console.log(`📋 Total lines: ${lines.length}`)

    // Get headers
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    console.log("📑 Headers:", headers)

    // Find keyword and URL columns
    const keywordIndex = headers.findIndex((h) => h.toLowerCase().includes("keyword"))
    const urlIndex = headers.findIndex((h) => h.toLowerCase().includes("url"))

    console.log(`🔍 Keyword column index: ${keywordIndex}`)
    console.log(`🔗 URL column index: ${urlIndex}`)

    if (keywordIndex === -1 || urlIndex === -1) {
      throw new Error("Could not find keyword or URL columns")
    }

    // Process data rows
    const keywords = []
    const errors = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))

      if (values.length > keywordIndex && values.length > urlIndex) {
        const keyword = values[keywordIndex]
        const url = values[urlIndex]

        if (keyword && url) {
          // Validate URL format
          try {
            new URL(url)
            keywords.push({
              keyword: keyword,
              target_url: url,
              active: true,
            })
          } catch (urlError) {
            errors.push({ row: i + 1, keyword, url, error: "Invalid URL format" })
          }
        } else {
          errors.push({ row: i + 1, keyword, url, error: "Missing keyword or URL" })
        }
      }
    }

    console.log(`✅ Successfully processed ${keywords.length} keywords`)
    console.log(`❌ Found ${errors.length} errors`)

    if (errors.length > 0) {
      console.log("🚨 Errors found:")
      errors.slice(0, 5).forEach((error) => {
        console.log(`  Row ${error.row}: ${error.error} - ${error.keyword} -> ${error.url}`)
      })
      if (errors.length > 5) {
        console.log(`  ... and ${errors.length - 5} more errors`)
      }
    }

    // Show sample of processed keywords
    console.log("\n📋 Sample of processed keywords:")
    keywords.slice(0, 10).forEach((kw, index) => {
      console.log(`  ${index + 1}. ${kw.keyword} -> ${kw.target_url}`)
    })

    if (keywords.length > 10) {
      console.log(`  ... and ${keywords.length - 10} more keywords`)
    }

    return { keywords, errors, totalProcessed: keywords.length }
  } catch (error) {
    console.error("❌ Error processing CSV:", error)
    throw error
  }
}

// Test the function
fetchAndProcessBrandCSV()
  .then((result) => {
    console.log("\n🎉 Processing complete!")
    console.log(`📊 Final stats: ${result.totalProcessed} keywords ready for upload`)
  })
  .catch((error) => {
    console.error("💥 Processing failed:", error.message)
  })
