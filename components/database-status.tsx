"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, AlertCircle, RefreshCw, Database } from "lucide-react"

interface DatabaseTest {
  table: string
  status: "success" | "error"
  error?: string
  count?: number
}

interface DatabaseStatus {
  success: boolean
  message: string
  tests: DatabaseTest[]
  summary: {
    total_tests: number
    passed: number
    failed: number
  }
}

export default function DatabaseStatus() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [loading, setLoading] = useState(false)

  const testDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-database")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error("Error testing database:", error)
      setStatus({
        success: false,
        message: "Failed to test database connection",
        tests: [],
        summary: { total_tests: 0, passed: 0, failed: 1 },
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testDatabase()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="w-5 h-5 mr-2" />
          Database Status
        </CardTitle>
        <CardDescription>Check if all database tables and functions are working correctly</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {status?.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="font-medium">
                {status?.message || (loading ? "Testing database..." : "Database status unknown")}
              </span>
            </div>
            <Button onClick={testDatabase} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Test Again
            </Button>
          </div>

          {status?.summary && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{status.summary.total_tests}</div>
                <div className="text-sm text-gray-600">Total Tests</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{status.summary.passed}</div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{status.summary.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>
          )}

          {status?.tests && status.tests.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {status.tests.map((test, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{test.table.replace("_", " ")}</TableCell>
                    <TableCell>
                      <Badge variant={test.status === "success" ? "default" : "destructive"}>
                        {test.status === "success" ? "Working" : "Error"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {test.status === "success" ? (
                        test.count !== undefined ? (
                          `${test.count} records`
                        ) : (
                          "Function working"
                        )
                      ) : (
                        <span className="text-red-600">{test.error}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
