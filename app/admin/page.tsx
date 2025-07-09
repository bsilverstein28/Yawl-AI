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
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
} from "lucide-react"

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center text-sm text-gray-600 hover:text-gray-900">
                <Home className="w-4 h-4 mr-1" />
                Back to Chat
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-sm font-medium text-gray-900">Admin Dashboard</span>
            </div>
            <Link href="/">
              <Button variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                Back to Chat
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your YawlAI chat system and monitor performance</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Chats</p>
                  <p className="text-2xl font-bold text-gray-900">1,234</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Keywords</p>
                  <p className="text-2xl font-bold text-gray-900">567</p>
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
                  <p className="text-sm font-medium text-gray-600">Impressions</p>
                  <p className="text-2xl font-bold text-gray-900">12.3K</p>
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
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">89</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {/* Keyword Management */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Keyword Management
              </CardTitle>
              <CardDescription>Manage keywords and target URLs for ad integration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/admin/keywords">
                  <Button className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Keywords
                  </Button>
                </Link>
                <div className="text-sm text-gray-600">
                  <p>• Add individual keywords</p>
                  <p>• Bulk upload via CSV</p>
                  <p>• Edit and delete keywords</p>
                  <p>• Toggle active/inactive status</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Dashboard */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                Analytics Dashboard
              </CardTitle>
              <CardDescription>View performance metrics and usage statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </Link>
                <div className="text-sm text-gray-600">
                  <p>• Chat usage statistics</p>
                  <p>• Keyword performance</p>
                  <p>• User engagement metrics</p>
                  <p>• Revenue tracking</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Tools */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2 text-purple-600" />
                Database Tools
              </CardTitle>
              <CardDescription>Database management and diagnostics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/admin/database-status">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Database className="w-4 h-4 mr-2" />
                    Database Status
                  </Button>
                </Link>
                <div className="text-sm text-gray-600">
                  <p>• Check database connection</p>
                  <p>• View table status</p>
                  <p>• Run diagnostics</p>
                  <p>• Monitor performance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest system events and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Database connection established</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
                <Badge variant="secondary">System</Badge>
              </div>

              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">New keywords added to database</p>
                  <p className="text-xs text-gray-500">15 minutes ago</p>
                </div>
                <Badge variant="secondary">Keywords</Badge>
              </div>

              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Chat session completed successfully</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
                <Badge variant="secondary">Chat</Badge>
              </div>

              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Analytics data updated</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
                <Badge variant="secondary">Analytics</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex space-x-6 mb-4 sm:mb-0">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
                Chat Interface
              </Link>
              <Link href="/admin/keywords" className="text-sm text-gray-600 hover:text-gray-900">
                Keywords
              </Link>
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                Analytics
              </Link>
              <Link href="/admin/database-status" className="text-sm text-gray-600 hover:text-gray-900">
                Database
              </Link>
            </div>
            <p className="text-sm text-gray-500">YawlAI Admin Dashboard v1.0</p>
          </div>
        </div>
      </div>
    </div>
  )
}
