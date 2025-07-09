"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import SupabaseSetupGuide from "@/components/supabase-setup-guide"

export default function SetupAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="outline" className="mb-4 bg-transparent">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Analytics Database Setup</h1>
          <p className="text-gray-600 dark:text-gray-400">Set up analytics tracking tables in your Supabase database</p>
        </div>

        <SupabaseSetupGuide />
      </div>
    </div>
  )
}
