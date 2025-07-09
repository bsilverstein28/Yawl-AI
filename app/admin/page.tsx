import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  Database,
  FileText,
  Home,
  KeyRound,
  MessageSquare,
  Settings,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react"

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
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
            <Link href="/">
              <Button variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                Back to Chat
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your YawlAI chat system and keyword database</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
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
                <div className="p-2 bg-green-100 rounded-lg">
                  <KeyRound className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Keywords</p>
                  <p className="text-2xl font-bold text-gray-900">567</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ad Impressions</p>
                  <p className="text-2xl font-bold text-gray-900">12.3K</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">89</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Keyword Management */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <KeyRound className="w-5 h-5 mr-2 text-blue-600" />
                Keyword Management
                <Badge className="ml-2" variant="default">
                  Primary
                </Badge>
              </CardTitle>
              <CardDescription>Manage keywords and target URLs for ad integration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/admin/keywords">
                  <Button className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Keywords
                  </Button>
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/admin/keywords">
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <FileText className="w-3 h-3 mr-1" />
                      Add Single
                    </Button>
                  </Link>
                  <Link href="/admin/keywords">
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <Upload className="w-3 h-3 mr-1" />
                      Bulk Upload
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card className="hover:shadow-lg transition-shadow">
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
                  <Button className="w-full bg-transparent" variant="outline">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </Link>
                <div className="text-sm text-gray-600">
                  <p>• Chat performance metrics</p>
                  <p>• Keyword effectiveness</p>
                  <p>• User engagement data</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Management */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2 text-purple-600" />
                Database Tools
              </CardTitle>
              <CardDescription>Database status and management tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/admin/database-status">
                  <Button className="w-full bg-transparent" variant="outline">
                    <Database className="w-4 h-4 mr-2" />
                    Database Status
                  </Button>
                </Link>
                <div className="text-sm text-gray-600">
                  <p>• Connection status</p>
                  <p>• Table health checks</p>
                  <p>• Performance monitoring</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="p-1 bg-blue-100 rounded">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New keywords added</p>
                  <p className="text-xs text-gray-600">5 keywords added via bulk upload</p>
                </div>
                <span className="text-xs text-gray-500">2 min ago</span>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="p-1 bg-green-100 rounded">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Chat session completed</p>
                  <p className="text-xs text-gray-600">User completed conversation with 3 ad integrations</p>
                </div>
                <span className="text-xs text-gray-500">5 min ago</span>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <div className="p-1 bg-purple-100 rounded">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Analytics updated</p>
                  <p className="text-xs text-gray-600">Daily metrics processed successfully</p>
                </div>
                <span className="text-xs text-gray-500">1 hour ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <Link href="/" className="hover:text-blue-600 transition-colors">
                Return to Chat
              </Link>
              <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                Analytics
              </Link>
              <Link href="/admin/keywords" className="hover:text-blue-600 transition-colors">
                Keywords
              </Link>
            </div>
            <div className="text-sm text-gray-500">YawlAI Admin Dashboard v1.0</div>
          </div>
        </div>
      </div>
    </div>
  )
}
