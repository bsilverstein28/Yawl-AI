// Test script to verify upload functionality
const testKeywords = [
  { keyword: "Nike", url: "https://nike.com/special-offer" },
  { keyword: "Apple", url: "https://apple.com/deals" },
  { keyword: "Tesla", url: "https://tesla.com/referral" },
  { keyword: "Amazon", url: "https://amazon.com/prime" },
  { keyword: "Google", url: "https://google.com/workspace" },
  { keyword: "Microsoft", url: "https://microsoft.com/office365" },
  { keyword: "Samsung", url: "https://samsung.com/galaxy" },
  { keyword: "Adobe", url: "https://adobe.com/creative-cloud" },
  { keyword: "Netflix", url: "https://netflix.com/subscribe" },
  { keyword: "Spotify", url: "https://spotify.com/premium" },
]

async function testBulkUpload() {
  try {
    console.log("Testing bulk upload with sample keywords...")

    const response = await fetch("/api/keywords/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: testKeywords }),
    })

    const result = await response.json()

    if (response.ok) {
      console.log("✅ Upload successful!")
      console.log(`📊 Results: ${result.inserted} inserted, ${result.errors} errors`)

      if (result.errors > 0) {
        console.log("❌ Errors:", result.errorDetails)
      }
    } else {
      console.log("❌ Upload failed:", result.error)
    }
  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

async function testKeywordLinking() {
  console.log("\n🔗 Testing keyword linking in AI responses...")

  const testMessage =
    "I love using Apple products and Nike shoes. Tesla cars are amazing, and I use Amazon Prime for shopping. Google Workspace helps with productivity."

  console.log("Original message:", testMessage)

  // This would be processed by the ad-processor
  console.log("Expected result: Keywords Apple, Nike, Tesla, Amazon, and Google should be converted to hyperlinks")
}

// Run tests
console.log("🧪 Starting upload functionality tests...\n")
testBulkUpload().then(() => {
  testKeywordLinking()
})

export { testKeywords, testBulkUpload, testKeywordLinking }
