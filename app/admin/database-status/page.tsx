"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import DatabaseStatus from "@/components/database-status"

export default function DatabaseStatusPage() {
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
          <h1 className="text-3xl font-bold">Database Status</h1>
          <p className="text-gray-600 dark:text-gray-400">Check the health of your database tables and functions</p>
        </div>

        <DatabaseStatus />
      </div>
    </div>
  )
}
