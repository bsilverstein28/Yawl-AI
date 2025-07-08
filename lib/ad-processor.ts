import { supabase } from "./supabase"

let cachedKeywords: any[] = []
let lastCacheUpdate = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

async function getActiveKeywords() {
  const now = Date.now()

  // Use cache if it's fresh
  if (cachedKeywords.length > 0 && now - lastCacheUpdate < CACHE_DURATION) {
    return cachedKeywords
  }

  try {
    const { data: keywords, error } = await supabase.from("keywords").select("*").eq("active", true)

    if (error) {
      // If table doesn't exist, return empty array instead of throwing
      console.warn("Keywords table not found or accessible:", error.message)
      return []
    }

    cachedKeywords = keywords || []
    lastCacheUpdate = now

    return cachedKeywords
  } catch (error) {
    console.error("Error fetching keywords:", error)
    return [] // Return empty array instead of cached data to prevent errors
  }
}

export async function processMessageWithAds(content: string, userSession?: string): Promise<string> {
  try {
    let processedContent = content
    const keywords = await getActiveKeywords()

    // If no keywords available, return original content
    if (!keywords || keywords.length === 0) {
      return processedContent
    }

    // Process keywords and insert links
    for (const ad of keywords) {
      const regex = new RegExp(`\\b${ad.keyword}\\b`, "gi")
      if (regex.test(processedContent)) {
        // Replace keyword with hyperlink
        processedContent = processedContent.replace(
          regex,
          `<a href="${ad.target_url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline font-medium transition-colors">${ad.keyword}</a>`,
        )
      }
    }

    return processedContent
  } catch (error) {
    console.error("Error processing message with ads:", error)
    // Return original content if ad processing fails
    return content
  }
}
