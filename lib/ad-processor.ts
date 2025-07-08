import { createClient } from "@supabase/supabase-js"

// Create a direct client for ad processing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

let cachedKeywords: any[] = []
let lastCacheUpdate = 0
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

async function getActiveKeywords() {
  const now = Date.now()

  // Use cache if it's fresh
  if (cachedKeywords.length > 0 && now - lastCacheUpdate < CACHE_DURATION) {
    console.log(`🔄 Using cached keywords: ${cachedKeywords.length} keywords`)
    return cachedKeywords
  }

  try {
    console.log("🔍 Fetching fresh keywords from database...")

    const { data: keywords, error } = await supabaseClient
      .from("keywords")
      .select("*")
      .eq("active", true)
      .order("keyword")

    if (error) {
      console.error("❌ Supabase error fetching keywords:", error)
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return cachedKeywords // Return cached data if available
    }

    if (!keywords) {
      console.warn("⚠️ No keywords returned from database (null result)")
      return []
    }

    if (keywords.length === 0) {
      console.warn("⚠️ No active keywords found in database")
      return []
    }

    cachedKeywords = keywords
    lastCacheUpdate = now

    console.log(`✅ Successfully loaded ${cachedKeywords.length} active keywords:`)
    cachedKeywords.forEach((k, index) => {
      console.log(`  ${index + 1}. "${k.keyword}" -> ${k.target_url}`)
    })

    return cachedKeywords
  } catch (error) {
    console.error("💥 Critical error fetching keywords:", error)
    return cachedKeywords // Return cached data if available
  }
}

export async function processMessageWithAds(content: string, userSession?: string): Promise<string> {
  try {
    console.log("🚀 === STARTING AD PROCESSING ===")
    console.log("📝 Original content:", content.substring(0, 200) + (content.length > 200 ? "..." : ""))
    console.log("📏 Content length:", content.length)

    const keywords = await getActiveKeywords()

    if (!keywords || keywords.length === 0) {
      console.log("❌ No keywords available - returning original content")
      console.log("🔍 Debug info:")
      console.log("  - Keywords array:", keywords)
      console.log("  - Array length:", keywords?.length)
      console.log("  - Cache status:", cachedKeywords.length > 0 ? "Has cache" : "No cache")
      return content
    }

    console.log(`🎯 Processing with ${keywords.length} keywords`)

    let processedContent = content
    const foundKeywords: string[] = []
    const processingLog: string[] = []

    // Sort keywords by length (longest first) to avoid partial matches
    const sortedKeywords = [...keywords].sort((a, b) => b.keyword.length - a.keyword.length)

    // Process each keyword
    for (const keyword of sortedKeywords) {
      try {
        const keywordText = keyword.keyword.trim()

        if (!keywordText) {
          console.warn(`⚠️ Skipping empty keyword:`, keyword)
          continue
        }

        // Create case-insensitive regex with word boundaries
        // Use more flexible word boundary that works with punctuation
        const escapedKeyword = keywordText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const regex = new RegExp(`(?<!<[^>]*)(\\b${escapedKeyword}\\b)(?![^<]*>)`, "gi")

        console.log(`🔍 Testing keyword: "${keywordText}"`)
        console.log(`  - Escaped: "${escapedKeyword}"`)
        console.log(`  - Regex: ${regex}`)

        // Check if keyword exists in content (avoid already linked content)
        const matches = processedContent.match(regex)

        if (matches && matches.length > 0) {
          // Check if this keyword is already linked
          const alreadyLinked = processedContent.includes(`data-keyword="${keywordText}"`)

          if (alreadyLinked) {
            console.log(`⚠️ "${keywordText}" already linked, skipping`)
            continue
          }

          foundKeywords.push(keywordText)
          const logEntry = `✅ Found "${keywordText}" ${matches.length} times: [${matches.join(", ")}]`
          console.log(logEntry)
          processingLog.push(logEntry)

          // Replace with link - use a more specific replacement to avoid double-linking
          const linkHtml = `<a href="${keyword.target_url}" target="_blank" rel="noopener noreferrer" class="ad-link" data-keyword="${keywordText}">$1</a>`

          console.log(`🔗 Replacing with: ${linkHtml}`)

          processedContent = processedContent.replace(regex, linkHtml)

          console.log(`📝 Content after replacement:`, processedContent.substring(0, 300) + "...")
        } else {
          const logEntry = `❌ "${keywordText}" not found in content`
          console.log(logEntry)
          processingLog.push(logEntry)
        }
      } catch (keywordError) {
        console.error(`💥 Error processing keyword "${keyword.keyword}":`, keywordError)
        continue // Skip this keyword and continue with others
      }
    }

    console.log("📊 === PROCESSING SUMMARY ===")
    console.log(`✅ Keywords found: ${foundKeywords.length}`)
    console.log(`📝 Found keywords: [${foundKeywords.join(", ")}]`)
    console.log(`📋 Processing log:`)
    processingLog.forEach((log, index) => console.log(`  ${index + 1}. ${log}`))

    if (foundKeywords.length > 0) {
      console.log("🎉 SUCCESS: Keywords were linked!")
    } else {
      console.log("😞 NO MATCHES: No keywords found in content")
      console.log("🔍 Debug analysis:")
      console.log("  - Available keywords:", keywords.map((k) => `"${k.keyword}"`).join(", "))
      console.log("  - Content preview:", content.substring(0, 500))

      // Test each keyword manually for debugging
      console.log("🧪 Manual keyword testing:")
      keywords.forEach((keyword) => {
        const keywordText = keyword.keyword.trim()
        const lowerContent = content.toLowerCase()
        const lowerKeyword = keywordText.toLowerCase()

        if (lowerContent.includes(lowerKeyword)) {
          console.log(`  ✅ "${keywordText}" found in lowercase search`)
        } else {
          console.log(`  ❌ "${keywordText}" not found even in lowercase`)
        }
      })
    }

    console.log("🏁 === AD PROCESSING COMPLETE ===")
    return processedContent
  } catch (error) {
    console.error("💥 CRITICAL ERROR in ad processing:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    // Always return original content if processing fails
    return content
  }
}

// Enhanced test function with detailed logging
export async function testKeywordMatching(content: string): Promise<void> {
  console.log("🧪 === KEYWORD MATCHING TEST ===")

  try {
    const keywords = await getActiveKeywords()
    console.log("📝 Test content:", content)
    console.log(`🎯 Testing against ${keywords.length} keywords`)

    if (keywords.length === 0) {
      console.log("❌ No keywords to test against!")
      return
    }

    console.log("📋 Available keywords:")
    keywords.forEach((k, index) => {
      console.log(`  ${index + 1}. "${k.keyword}" -> ${k.target_url}`)
    })

    console.log("\n🔍 Testing each keyword:")

    for (const keyword of keywords) {
      const keywordText = keyword.keyword.trim()
      const escapedKeyword = keywordText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, "gi")
      const matches = content.match(regex)

      console.log(`\n🔍 Testing: "${keywordText}"`)
      console.log(`  - Regex: ${regex}`)

      if (matches) {
        console.log(`  ✅ FOUND ${matches.length} times: [${matches.join(", ")}]`)
      } else {
        console.log(`  ❌ NOT FOUND`)

        // Additional debugging
        const lowerContent = content.toLowerCase()
        const lowerKeyword = keywordText.toLowerCase()

        if (lowerContent.includes(lowerKeyword)) {
          console.log(`  🔍 Found in lowercase search - might be word boundary issue`)
        } else {
          console.log(`  🔍 Not found even in lowercase search`)
        }
      }
    }

    // Test the actual processing function
    console.log("\n🚀 Testing actual processing function:")
    const processed = await processMessageWithAds(content)
    console.log("📝 Processed result:", processed)

    if (processed !== content) {
      console.log("✅ Content was modified - links were added!")
    } else {
      console.log("❌ Content unchanged - no links were added")
    }
  } catch (error) {
    console.error("💥 Error in test:", error)
  }

  console.log("🏁 === END TEST ===")
}

// Function to clear cache and force refresh
export function clearKeywordCache() {
  cachedKeywords = []
  lastCacheUpdate = 0
  console.log("🗑️ Keyword cache cleared - next request will fetch fresh data")
}

// Function to get current cache status
export function getCacheStatus() {
  return {
    keywordCount: cachedKeywords.length,
    lastUpdate: lastCacheUpdate,
    age: Date.now() - lastCacheUpdate,
    keywords: cachedKeywords.map((k) => ({ keyword: k.keyword, url: k.target_url })),
  }
}

// Function to manually test database connection
export async function testDatabaseConnection() {
  console.log("🔌 Testing database connection...")

  try {
    const { data, error } = await supabaseClient.from("keywords").select("count", { count: "exact" }).limit(1)

    if (error) {
      console.error("❌ Database connection failed:", error)
      return { success: false, error: error.message }
    }

    console.log("✅ Database connection successful")
    return { success: true, count: data?.length || 0 }
  } catch (error) {
    console.error("💥 Database test error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Function to suggest brand names for AI responses
export async function suggestBrandMentions(query: string): Promise<string[]> {
  try {
    const keywords = await getActiveKeywords()
    const suggestions: string[] = []

    // Look for relevant keywords based on the query
    const queryLower = query.toLowerCase()

    keywords.forEach((keyword) => {
      const keywordLower = keyword.keyword.toLowerCase()

      // Add brand if query is about categories that might include this brand
      if (queryLower.includes("sportswear") || queryLower.includes("athletic") || queryLower.includes("shoes")) {
        if (["nike", "adidas", "puma", "under armour"].includes(keywordLower)) {
          suggestions.push(keyword.keyword)
        }
      }

      if (queryLower.includes("tech") || queryLower.includes("computer") || queryLower.includes("phone")) {
        if (["apple", "microsoft", "google", "samsung"].includes(keywordLower)) {
          suggestions.push(keyword.keyword)
        }
      }

      if (queryLower.includes("car") || queryLower.includes("vehicle") || queryLower.includes("electric")) {
        if (["tesla", "ford", "bmw", "mercedes"].includes(keywordLower)) {
          suggestions.push(keyword.keyword)
        }
      }

      if (queryLower.includes("shopping") || queryLower.includes("online") || queryLower.includes("ecommerce")) {
        if (["amazon", "ebay", "walmart"].includes(keywordLower)) {
          suggestions.push(keyword.keyword)
        }
      }
    })

    return suggestions
  } catch (error) {
    console.error("Error getting brand suggestions:", error)
    return []
  }
}
