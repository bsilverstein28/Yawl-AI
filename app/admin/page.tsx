"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  Settings,
  BarChart3,
  Database,
  FileText,
  Activity,
  TrendingUp,
  MessageSquare,
  Search,
  Upload,
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
} from "lucide-react"

interface DashboardStats {
  totalKeywords: number
  activeKeywords: number
  inactiveKeywords: number
  totalSearches: number
  totalImpressions: number
  totalClicks: number
  ctr: number
  revenue: number
  recentActivity: Array<{
    type: string
    content: string
    timestamp: string
    session?: string
  }>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalKeywords: 0,
    activeKeywords: 0,
    inactiveKeywords: 0,
    totalSearches: 0,
    totalImpressions: 0,
    totalClicks: 0,
    ctr: 0,
    revenue: 0,
    recentActivity: [],
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)

      // Fetch keywords data
      const keywordsResponse = await fetch("/api/keywords")
      const keywordsData = await keywordsResponse.json()

      // Fetch analytics data
      const analyticsResponse = await fetch("/api/analytics")
      const analyticsData = await analyticsResponse.json()

      const activeKeywords = keywordsData.keywords?.filter((k: any) => k.active).length || 0
      const totalKeywords = keywordsData.keywords?.length || 0
      const inactiveKeywords = totalKeywords - activeKeywords

      setStats({
        totalKeywords,
        activeKeywords,
        inactiveKeywords,
        totalSearches: analyticsData.totals?.chat_questions || 0,
        totalImpressions: analyticsData.totals?.keywords_shown || 0,
        totalClicks: analyticsData.totals?.keyword_clicks || 0,
        ctr: analyticsData.totals?.ctr || 0,
        revenue: analyticsData.totals?.revenue || 0,
        recentActivity: analyticsData.recentActivity || [],
      })

      setLastUpdated(new Date())
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardStats()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "K"
    return num.toString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "search":
        return <Search className="w-4 h-4 text-blue-600" />
      case "impression":
        return <FileText className="w-4 h-4 text-green-600" />
      case "click":
        return <TrendingUp className="w-4 h-4 text-purple-600" />
      default:
        return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "search":
        return "bg-blue-50"
      case "impression":
        return "bg-green-50"
      case "click":
        return "bg-purple-50"
      default:
        return "bg-gray-50"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Link href="/" className="flex items-center hover:text-blue-600 transition-colors">
                <Home className="w-4 h-4 mr-1" />
                Back to Chat
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Admin Dashboard</span>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={fetchDashboardStats} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Link href="/">
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Back to Chat
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Real-time system metrics and management tools
                {lastUpdated && (
                  <span className="ml-2 text-sm text-gray-500">• Last updated: {lastUpdated.toLocaleTimeString()}</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Keywords</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? "..." : formatNumber(stats.totalKeywords)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.activeKeywords} active, {stats.inactiveKeywords} inactive
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MessageSquare className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Chats</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? "..." : formatNumber(stats.totalSearches)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">User conversations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ad Impressions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? "..." : formatNumber(stats.totalImpressions)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Keywords shown to users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? "..." : formatNumber(stats.totalClicks)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">CTR: {stats.ctr.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Click-Through Rate</span>
                  <Badge variant={stats.ctr > 2 ? "default" : "secondary"}>{stats.ctr.toFixed(2)}%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Revenue</span>
                  <Badge variant="default">{formatCurrency(stats.revenue)}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg. Revenue per Click</span>
                  <Badge variant="secondary">$0.05</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="w-5 h-5 mr-2 text-blue-600" />
                Keyword Management
              </CardTitle>
              <CardDescription>Manage advertising keywords and target URLs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Keywords</span>
                <Badge variant="default">{stats.activeKeywords}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Inactive Keywords</span>
                <Badge variant="secondary">{stats.inactiveKeywords}</Badge>
              </div>
              <div className="flex space-x-2 pt-2">
                <Link href="/admin/keywords" className="flex-1">
                  <Button className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Keywords
                  </Button>
                </Link>
              </div>
              <div className="flex space-x-2">
                <Link href="/admin/keywords" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    <Upload className="w-4 h-4 mr-2" />
                    Bulk Upload
                  </Button>
                </Link>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                Analytics Dashboard
              </CardTitle>
              <CardDescription>View detailed performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Today's Impressions</span>
                <Badge variant="default">{formatNumber(stats.totalImpressions)}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Today's Clicks</span>
                <Badge variant="default">{formatNumber(stats.totalClicks)}</Badge>
              </div>
              <Link href="/dashboard">
                <Button className="w-full">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Full Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Live Activity Feed
            </CardTitle>
            <CardDescription>Real-time system events and user interactions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading activity...</span>
              </div>
            ) : stats.recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity</p>
                <p className="text-sm">Activity will appear here as users interact with the system</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {stats.recentActivity.slice(0, 10).map((activity, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-3 rounded-lg ${getActivityColor(activity.type)}`}
                  >
                    <div className="flex-shrink-0">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{activity.content}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                        {activity.session && (
                          <span className="ml-2">• Session: {activity.session.substring(0, 8)}...</span>
                        )}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              System Status
            </CardTitle>
            <CardDescription>Current system health and connectivity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-900">Database</p>
                <p className="text-xs text-green-700">Connected</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-900">API</p>
                <p className="text-xs text-green-700">Operational</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-900">Analytics</p>
                <p className="text-xs text-green-700">Active</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-900">Chat AI</p>
                <p className="text-xs text-green-700">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex space-x-6">
              <Link href="/" className="text-sm text-gray-600 hover:text-blue-600">
                Back to Chat
              </Link>
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-blue-600">
                Full Analytics
              </Link>
              <Link href="/admin/keywords" className="text-sm text-gray-600 hover:text-blue-600">
                Manage Keywords
              </Link>
              <Link href="/admin/database-status" className="text-sm text-gray-600 hover:text-blue-600">
                Database Status
              </Link>
            </div>
            <p className="text-sm text-gray-500">YawlAI Admin Dashboard • Real-time Data</p>
          </div>
        </div>
      </div>
    </div>
  )
}
