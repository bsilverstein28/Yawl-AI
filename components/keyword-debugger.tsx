"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  testKeywordMatching,
  clearKeywordCache,
  getCacheStatus,
  testDatabaseConnection,
  processMessageWithAds,
} from "@/lib/ad-processor"
import { Bug, RefreshCw, Database, TestTube, Zap, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function KeywordDebugger() {
  const [testContent, setTestContent] = useState(
    "I love Nike shoes and Apple products. Tesla cars are amazing, and I use Amazon for shopping. Microsoft Office is great for work.",
  )
  const [testing, setTesting] = useState(false)
  const [cacheStatus, setCacheStatus] = useState<any>(null)
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [processedResult, setProcessedResult] = useState<string>("")
  const { toast } = useToast()

  const runKeywordTest = async () => {
    setTesting(true)
    try {
      console.clear() // Clear console for clean output
      console.log("🚀 Starting comprehensive keyword test...")

      // Test database connection first
      const dbTest = await testDatabaseConnection()
      setDbStatus(dbTest)

      if (!dbTest.success) {
        toast({
          title: "Database Connection Failed",
          description: dbTest.error,
          variant: "destructive",
        })
        return
      }

      // Run keyword matching test
      await testKeywordMatching(testContent)

      // Test actual processing
      const processed = await processMessageWithAds(testContent)
      setProcessedResult(processed)

      // Update cache status
      const cache = getCacheStatus()
      setCacheStatus(cache)

      toast({
        title: "Keyword Test Complete",
        description: "Check the browser console for detailed results and see the processed output below.",
      })
    } catch (error) {
      console.error("Test error:", error)
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  const clearCache = () => {
    clearKeywordCache()
    setCacheStatus(null)
    toast({
      title: "Cache Cleared",
      description: "Keyword cache has been cleared. Next test will fetch fresh data.",
    })
  }

  const refreshCacheStatus = () => {
    const cache = getCacheStatus()
    setCacheStatus(cache)
  }

  const testWithProblematicContent = () => {
    setTestContent(
      "There are several popular sportswear brands known for their quality, innovation, and style. Here are some of the most recognized: Nike is one of the largest and most famous sportswear brands globally, known for its athletic footwear, apparel, and equipment. Adidas is a leading brand that offers a wide range of sports clothing, shoes, and accessories, recognized for its iconic three stripes. Puma is known for its stylish and performance-oriented athletic gear, offers products for various sports and fitness activities.",
    )
  }

  return (
    <div className="space-y-6">
      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bug className="w-5 h-5 mr-2" />
            Keyword Debugging Tool
          </CardTitle>
          <CardDescription>Test keyword matching and ad processing with detailed logging</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Test Content</label>
              <Textarea
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
                placeholder="Enter text to test keyword matching..."
                rows={4}
              />
            </div>

            <div className="flex space-x-2 flex-wrap gap-2">
              <Button onClick={runKeywordTest} disabled={testing}>
                <TestTube className="w-4 h-4 mr-2" />
                {testing ? "Testing..." : "Run Keyword Test"}
              </Button>

              <Button onClick={clearCache} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear Cache
              </Button>

              <Button onClick={refreshCacheStatus} variant="outline">
                <Database className="w-4 h-4 mr-2" />
                Check Cache
              </Button>

              <Button onClick={testWithProblematicContent} variant="outline">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Test Problem Content
              </Button>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>💡 Tip:</strong> The "Test Problem Content" button loads content similar to your example where
                brand names are mentioned but might not be getting linked.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Status */}
      {dbStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Database Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={dbStatus.success ? "default" : "destructive"}>
                {dbStatus.success ? "✅ Connected" : "❌ Failed"}
              </Badge>
              {dbStatus.error && <span className="text-sm text-red-600">{dbStatus.error}</span>}
              {dbStatus.count !== undefined && (
                <span className="text-sm text-gray-600">({dbStatus.count} records)</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cache Status */}
      {cacheStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Cache Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{cacheStatus.keywordCount} keywords cached</Badge>
                <Badge variant="outline">Age: {Math.round(cacheStatus.age / 1000)}s</Badge>
              </div>

              {cacheStatus.keywords.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Cached Keywords:</p>
                  <div className="flex flex-wrap gap-1">
                    {cacheStatus.keywords.map((k: any, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {k.keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processed Result */}
      {processedResult && (
        <Card>
          <CardHeader>
            <CardTitle>Processed Result</CardTitle>
            <CardDescription>This is how the content looks after ad processing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Original Content:</p>
                <div className="p-3 bg-gray-50 rounded text-sm">{testContent}</div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Processed Content:</p>
                <div className="p-3 bg-blue-50 rounded text-sm" dangerouslySetInnerHTML={{ __html: processedResult }} />
              </div>

              <div>
                <Badge variant={processedResult !== testContent ? "default" : "destructive"}>
                  {processedResult !== testContent ? "✅ Content Modified" : "❌ No Changes"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Debug Brand Linking Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-medium text-red-800 mb-2">🚨 Common Issue: AI Not Mentioning Brand Names</p>
              <p className="text-red-700">
                If your AI responses say "a popular sportswear brand" instead of "Nike", the ad processor can't create
                links because the brand name isn't mentioned.
              </p>
            </div>

            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-medium text-green-800 mb-2">✅ Solution: Updated AI System Prompt</p>
              <p className="text-green-700">
                I've updated the AI to specifically mention brand names like Nike, Apple, Tesla, etc. instead of generic
                descriptions.
              </p>
            </div>

            <div>
              <p className="font-medium mb-2">🔍 Debugging Steps:</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Open Browser Console (F12 → Console tab)</li>
                <li>Click "Test Problem Content" to test with realistic content</li>
                <li>Click "Run Keyword Test" to see detailed logging</li>
                <li>Check if brand names are actually present in the text</li>
                <li>Look for keyword matching results in the console</li>
                <li>Verify the processed result shows linked brands</li>
              </ol>
            </div>

            <div>
              <p className="font-medium mb-2">🎯 What to Look For:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>✅ Brand names explicitly mentioned (Nike, Apple, Tesla)</li>
                <li>✅ Keywords found and matched in console logs</li>
                <li>✅ Links created in the processed result</li>
                <li>❌ Generic descriptions without brand names</li>
                <li>❌ No keyword matches found</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
