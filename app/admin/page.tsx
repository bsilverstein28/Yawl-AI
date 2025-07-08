"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Settings,
  Database,
  BarChart3,
  Upload,
  Key,
  TestTube,
  FileText,
  Activity,
  Users,
  DollarSign,
  TrendingUp,
  MessageSquare,
} from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Settings className="w-8 h-8 mr-3 text-blue-600" />
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Manage your YawlAI system configuration and analytics</p>
          </div>
          <Link href="/">
            <Button variant="outline">
              <MessageSquare className="w-4 h-4 mr-2" />
              Back to Chat
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$2,345</div>
              <p className="text-xs text-muted-foreground">+8% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Keyword CTR</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.2%</div>
              <p className="text-xs text-muted-foreground">+0.5% from last week</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Admin Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Analytics Dashboard */}
          <Link href="/dashboard">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-800">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Analytics Dashboard
                </CardTitle>
                <CardDescription>
                  View detailed analytics including chat questions, keyword impressions, clicks, and CTR metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Today's Questions:</span>
                    <span className="font-semibold">127</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Keywords Shown:</span>
                    <span className="font-semibold">342</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Clicks:</span>
                    <span className="font-semibold">23</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>CTR:</span>
                    <span className="font-semibold text-green-600">6.7%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Database Management */}
          <Link href="/admin/database-status">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  Database Management
                </CardTitle>
                <CardDescription>Monitor database health, run migrations, and manage data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Connection: Healthy</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span>Tables: 8 active</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    <span>Last backup: 2 hours ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Keyword Management */}
          <Link href="/admin/debug-keywords">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="w-5 h-5 mr-2" />
                  Keyword Management
                </CardTitle>
                <CardDescription>Manage keywords, test matching, and debug ad processing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Keywords:</span>
                    <span className="font-semibold">156</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Processing Rate:</span>
                    <span className="font-semibold">98.5%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cache Status:</span>
                    <span className="font-semibold text-green-600">Fresh</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Brand Upload */}
          <Link href="/admin/brand-upload">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Brand Upload
                </CardTitle>
                <CardDescription>Upload and manage brand CSV files for keyword targeting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Last Upload:</span>
                    <span className="font-semibold">3 days ago</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Brands Loaded:</span>
                    <span className="font-semibold">89</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Status:</span>
                    <span className="font-semibold text-green-600">Ready</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* API Diagnostics */}
          <Link href="/admin/api-diagnostics">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TestTube className="w-5 h-5 mr-2" />
                  API Diagnostics
                </CardTitle>
                <CardDescription>Test API connections, check configurations, and debug issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>OpenAI API: Connected</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Supabase: Connected</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                    <span>Rate Limits: 85% used</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* File Upload Testing */}
          <Link href="/test-upload">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  File Upload Testing
                </CardTitle>
                <CardDescription>Test file upload functionality and processing capabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Supported Types:</span>
                    <span className="font-semibold">8</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Max Size:</span>
                    <span className="font-semibold">10MB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Processing:</span>
                    <span className="font-semibold text-green-600">Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* System Information */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Current system status and configuration details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Environment</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Mode:</span>
                      <span className="font-mono">Production</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Version:</span>
                      <span className="font-mono">v1.2.3</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Uptime:</span>
                      <span className="font-mono">7d 14h 23m</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Performance</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Response Time:</span>
                      <span className="font-mono">245ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Memory Usage:</span>
                      <span className="font-mono">67%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CPU Usage:</span>
                      <span className="font-mono">23%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Configuration</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>OpenAI Model:</span>
                      <span className="font-mono">gpt-4o-mini</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Tokens:</span>
                      <span className="font-mono">2000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Temperature:</span>
                      <span className="font-mono">0.7</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
