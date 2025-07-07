import { createClient } from "@supabase/supabase-js"

// Create a direct client for ad processing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

let cachedKeywords: any[] = []
let lastCacheUpdate = 0
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes (shorter cache)

async function getActiveKeywords() {
  const now = Date.now()

  // Use cache if it's fresh
  if (cachedKeywords.length > 0 && now - lastCacheUpdate < CACHE_DURATION) {
    console.log(`Using cached keywords: ${cachedKeywords.length} keywords`)
    return cachedKeywords
  }

  try {
    console.log("Fetching fresh keywords from database...")

    const { data: keywords, error } = await supabaseClient.from("keywords").select("*").eq("active", true)

    if (error) {
      console.error("Supabase error fetching keywords:", error)
      return cachedKeywords // Return cached data if available
    }

    if (!keywords) {
      console.warn("No keywords returned from database")
      return []
    }

    cachedKeywords = keywords
    lastCacheUpdate = now

    console.log(
      `Successfully loaded ${cachedKeywords.length} active keywords:`,
      cachedKeywords.map((k) => k.keyword).join(", "),
    )

    return cachedKeywords
  } catch (error) {
    console.error("Error fetching keywords:", error)
    return cachedKeywords // Return cached data if available
  }
}

export async function processMessageWithAds(content: string, userSession?: string): Promise<string> {
  try {
    console.log("=== Starting ad processing ===")
    console.log("Original content length:", content.length)

    const keywords = await getActiveKeywords()

    if (!keywords || keywords.length === 0) {
      console.log("No keywords available - returning original content")
      return content
    }

    let processedContent = content
    const foundKeywords: string[] = []

    // Process each keyword
    for (const keyword of keywords) {
      try {
        // Create case-insensitive regex with word boundaries
        const keywordText = keyword.keyword.trim()
        const escapedKeyword = keywordText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const regex = new RegExp(`\\b${escapedKeyword}\\b`, "gi")

        // Check if keyword exists in content
        const matches = processedContent.match(regex)

        if (matches && matches.length > 0) {
          foundKeywords.push(keywordText)
          console.log(`Found keyword "${keywordText}" ${matches.length} times`)

          // Replace with link
          processedContent = processedContent.replace(
            regex,
            `<a href="${keyword.target_url}" target="_blank" rel="noopener noreferrer" class="ad-link" data-keyword="${keywordText}">${keywordText}</a>`,
          )
        }
      } catch (keywordError) {
        console.error(`Error processing keyword "${keyword.keyword}":`, keywordError)
        continue // Skip this keyword and continue with others
      }
    }

    if (foundKeywords.length > 0) {
      console.log(`✅ Successfully linked ${foundKeywords.length} keywords:`, foundKeywords.join(", "))
    } else {
      console.log("❌ No keywords found in content")
      console.log("Available keywords:", keywords.map((k) => k.keyword).join(", "))
      console.log("Content preview:", content.substring(0, 200) + "...")
    }

    console.log("=== Ad processing complete ===")
    return processedContent
  } catch (error) {
    console.error("Critical error in ad processing:", error)
    // Always return original content if processing fails
    return content
  }
}

// Function to test keyword matching (for debugging)
export async function testKeywordMatching(content: string): Promise<void> {
  console.log("=== KEYWORD MATCHING TEST ===")

  try {
    const keywords = await getActiveKeywords()
    console.log("Test content:", content)
    console.log(
      `Testing against ${keywords.length} keywords:`,
      keywords.map((k) => k.keyword),
    )

    for (const keyword of keywords) {
      const keywordText = keyword.keyword.trim()
      const escapedKeyword = keywordText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, "gi")
      const matches = content.match(regex)

      if (matches) {
        console.log(`✅ "${keywordText}" found ${matches.length} times:`, matches)
      } else {
        console.log(`❌ "${keywordText}" not found`)
      }
    }
  } catch (error) {
    console.error("Error in test:", error)
  }

  console.log("=== END TEST ===")
}

// Function to clear cache (useful for testing)
export function clearKeywordCache() {
  cachedKeywords = []
  lastCacheUpdate = 0
  console.log("Keyword cache cleared")
}
