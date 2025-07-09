"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, TrendingUp, Eye, MousePointer, DollarSign, Clock, Globe } from "lucide-react"

export default function AnalyticsExplanation() {
  return (
    <div className="space-y-6">
      {/* What IS Tracked */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center text-green-800">
            <TrendingUp className="w-5 h-5 mr-2" />✅ What IS Tracked Permanently
          </CardTitle>
          <CardDescription className="text-green-700">
            All this data persists across days, weeks, and months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-green-600" />
                <span className="font-medium">Daily Metrics</span>
              </div>
              <ul className="text-sm space-y-1 ml-6">
                <li>• Total searches per day</li>
                <li>• Keyword impressions per day</li>
                <li>• Click-through rates per day</li>
                <li>• Revenue per day</li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-green-600" />
                <span className="font-medium">Individual Events</span>
              </div>
              <ul className="text-sm space-y-1 ml-6">
                <li>• Every search query with timestamp</li>
                <li>• Every keyword shown with timestamp</li>
                <li>• Every link click with timestamp</li>
                <li>• Token usage per conversation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Tracking Reality */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center text-yellow-800">
            <Users className="w-5 h-5 mr-2" />
            ⚠️ User Tracking Reality
          </CardTitle>
          <CardDescription className="text-yellow-700">
            How "users" are actually identified in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 bg-white rounded border">
              <div className="font-medium mb-2">Session-Based Tracking:</div>
              <div className="text-sm space-y-1">
                <div>• Each browser session = unique "user"</div>
                <div>• Same person on phone + laptop = 2 "users"</div>
                <div>• Same person, different browsers = 2 "users"</div>
                <div>• Clear cookies = becomes "new user"</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Badge variant="outline" className="mb-2">
                  Privacy Focused
                </Badge>
                <div>No personal data collected</div>
              </div>
              <div>
                <Badge variant="outline" className="mb-2">
                  No Login Required
                </Badge>
                <div>Anonymous usage tracking</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Dashboard Metrics Over Time
          </CardTitle>
          <CardDescription>What you'll see in your analytics dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <MousePointer className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Usage Trends</span>
              </div>
              <ul className="text-sm space-y-1">
                <li>• Daily active sessions</li>
                <li>• Peak usage hours</li>
                <li>• Popular search topics</li>
                <li>• Session duration patterns</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="font-medium">Keyword Performance</span>
              </div>
              <ul className="text-sm space-y-1">
                <li>• Most shown brands</li>
                <li>• Highest click-through rates</li>
                <li>• Revenue per keyword</li>
                <li>• Trending keywords</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-purple-500" />
                <span className="font-medium">Business Metrics</span>
              </div>
              <ul className="text-sm space-y-1">
                <li>• Daily revenue tracking</li>
                <li>• Conversion rates</li>
                <li>• ROI per keyword</li>
                <li>• Growth trends</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Example Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Example: What Gets Tracked Over 30 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-gray-50 rounded">
              <div className="font-medium">Day 1:</div>
              <div>50 searches, 120 keyword impressions, 8 clicks, $0.40 revenue</div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="font-medium">Day 15:</div>
              <div>73 searches, 180 keyword impressions, 12 clicks, $0.60 revenue</div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="font-medium">Day 30:</div>
              <div>89 searches, 210 keyword impressions, 15 clicks, $0.75 revenue</div>
            </div>
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <div className="font-medium text-blue-800">30-Day Totals:</div>
              <div className="text-blue-700">2,100 searches, 5,200 impressions, 350 clicks, $17.50 revenue</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
