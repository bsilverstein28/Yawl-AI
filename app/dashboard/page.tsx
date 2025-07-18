"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  TrendingUp,
  MousePointer,
  MessageSquare,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Activity,
  Eye,
  Search,
  Home,
} from "lucide-react"
import Link from "next/link"

interface AnalyticsData {
  needsSetup?: boolean
  message?: string
  totals: {
    chat_questions: number
    keywords_shown: number
    keyword_clicks: number
    ctr: number
    revenue: number
  }
  dailyStats: Array<{
    date: string
    searches: number
    impressions: number
    clicks: number
    revenue: number
  }>
  topKeywords: Array<{
    keyword: string
    impressions: number
    clicks: number
    ctr: number
    revenue: number
  }>
  recentActivity: Array<{
    type: string
    content: string
    timestamp: string
    session: string
  }>
  topTokenSessions: Array<{
    session_id: string
    total_tokens: number
    message_count: number
    last_activity: string
  }>
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("🔄 Fetching real analytics data...")

      const response = await fetch("/api/analytics", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store", // Always fetch fresh data
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log("📊 Real analytics data received:", result)

      setData(result)
    } catch (err) {
      console.error("❌ Error fetching analytics:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch analytics data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()

    // Auto-refresh every 30 seconds to show real-time data
    const interval = setInterval(fetchAnalytics, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString()
    } catch {
      return dateString
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "search":
        return <Search className="w-4 h-4 text-blue-500" />
      case "impression":
        return <Eye className="w-4 h-4 text-green-500" />
      case "click":
        return <MousePointer className="w-4 h-4 text-purple-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case "search":
        return "bg-blue-100 text-blue-800"
      case "impression":
        return "bg-green-100 text-green-800"
      case "click":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading real analytics data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Error Loading Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex space-x-2">
              <Button onClick={fetchAnalytics} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              <Link href="/admin">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Admin
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No data available</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center mb-2">
              <Link href="/" className="text-blue-600 hover:text-blue-800 flex items-center text-sm mr-4">
                <Home className="w-4 h-4 mr-1" />← Back to Chat
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="w-8 h-8 mr-3 text-blue-600" />
              Real-Time Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Live data from your AI chat performance and keyword engagement</p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={fetchAnalytics} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
            <Link href="/admin">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
          </div>
        </div>

        {/* Setup Warning */}
        {data.needsSetup && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-800">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Database Setup Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700 mb-4">{data.message}</p>
              <p className="text-sm text-orange-600">
                Run the <code className="bg-orange-100 px-2 py-1 rounded">complete-analytics-setup.sql</code> script to
                enable full analytics tracking.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Real-Time Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chat Questions</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{data.totals.chat_questions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total AI queries processed</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Keywords Shown</CardTitle>
              <Eye className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{data.totals.keywords_shown.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Keyword impressions</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Keyword Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{data.totals.keyword_clicks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total link clicks</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{data.totals.ctr.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">Clicks ÷ Impressions</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${data.totals.revenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">$0.05 per click</p>
            </CardContent>
          </Card>
        </div>

        {/* Real Data Analytics */}
        <Tabs defaultValue="keywords" className="space-y-6">
          <TabsList>
            <TabsTrigger value="keywords">Top Keywords</TabsTrigger>
            <TabsTrigger value="activity">Live Activity</TabsTrigger>
            <TabsTrigger value="daily">Daily Stats</TabsTrigger>
            <TabsTrigger value="tokens">Token Usage</TabsTrigger>
          </TabsList>

          <TabsContent value="keywords">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Keywords (Real Data)</CardTitle>
                <CardDescription>Keywords ranked by actual engagement and revenue</CardDescription>
              </CardHeader>
              <CardContent>
                {data.topKeywords.length > 0 ? (
                  <div className="space-y-4">
                    {data.topKeywords.map((keyword, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{keyword.keyword}</h3>
                          <div className="flex space-x-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center">
                              <Eye className="w-3 h-3 mr-1" />
                              {keyword.impressions} impressions
                            </span>
                            <span className="flex items-center">
                              <MousePointer className="w-3 h-3 mr-1" />
                              {keyword.clicks} clicks
                            </span>
                            <span className="flex items-center">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {keyword.ctr.toFixed(2)}% CTR
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600 text-xl">${keyword.revenue.toFixed(2)}</div>
                          <div className="text-sm text-gray-500">revenue</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No keyword data yet</p>
                    <p className="text-sm">Keywords will appear here once users interact with your AI responses</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Live Activity Feed (Real Data)</CardTitle>
                <CardDescription>Real-time feed of actual user interactions</CardDescription>
              </CardHeader>
              <CardContent>
                {data.recentActivity.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {data.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg bg-white">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge className={`text-xs ${getActivityBadgeColor(activity.type)}`}>{activity.type}</Badge>
                            <span className="text-xs text-gray-500">{formatTime(activity.timestamp)}</span>
                          </div>
                          <p className="text-sm text-gray-800">{activity.content}</p>
                          <p className="text-xs text-gray-500">Session: {activity.session}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No recent activity</p>
                    <p className="text-sm">User interactions will appear here in real-time</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="daily">
            <Card>
              <CardHeader>
                <CardTitle>Daily Statistics (Real Data)</CardTitle>
                <CardDescription>Actual performance metrics over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                {data.dailyStats.length > 0 ? (
                  <div className="space-y-4">
                    {data.dailyStats.map((day, index) => (
                      <div key={index} className="grid grid-cols-5 gap-4 p-4 border rounded-lg bg-white">
                        <div>
                          <div className="text-sm font-medium">{formatDate(day.date)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-600">{day.searches}</div>
                          <div className="text-xs text-gray-500">Searches</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-green-600">{day.impressions}</div>
                          <div className="text-xs text-gray-500">Impressions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-purple-600">{day.clicks}</div>
                          <div className="text-xs text-gray-500">Clicks</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-green-600">${day.revenue.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">Revenue</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No daily statistics available</p>
                    <p className="text-sm">Daily metrics will appear here once data is collected</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tokens">
            <Card>
              <CardHeader>
                <CardTitle>Token Usage Sessions (Real Data)</CardTitle>
                <CardDescription>Actual AI token consumption by session</CardDescription>
              </CardHeader>
              <CardContent>
                {data.topTokenSessions.length > 0 ? (
                  <div className="space-y-4">
                    {data.topTokenSessions.map((session, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                        <div className="flex-1">
                          <h3 className="font-semibold">Session: {session.session_id}</h3>
                          <div className="flex space-x-4 text-sm text-gray-600 mt-1">
                            <span>{session.message_count} messages</span>
                            <span>Last: {formatTime(session.last_activity)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-blue-600 text-xl">
                            {session.total_tokens.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">tokens</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No token usage data</p>
                    <p className="text-sm">Token usage will appear here once tracking is enabled</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
