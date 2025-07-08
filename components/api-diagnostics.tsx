"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle, XCircle, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DiagnosticResult {
  success: boolean
  message?: string
  error?: string
  response?: string
  diagnostics: {
    timestamp: string
    environment: string
    apiKeyPresent: boolean
    apiKeyFormat: string
    apiKeyLength?: number
    apiKeyPrefix?: string
  }
}

export default function APIDiagnostics() {
  const [result, setResult] = useState<DiagnosticResult | null>(null)
  const [testing, setTesting] = useState(false)
  const { toast } = useToast()

  const runDiagnostics = async () => {
    setTesting(true)
    try {
      const response = await fetch("/api/test-openai")
      const data = await response.json()
      setResult(data)

      if (data.success) {
        toast({
          title: "API Test Successful",
          description: "OpenAI API is working correctly!",
        })
      } else {
        toast({
          title: "API Test Failed",
          description: data.error || "Unknown error",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Diagnostic error:", error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Network error",
        diagnostics: {
          timestamp: new Date().toISOString(),
          environment: "unknown",
          apiKeyPresent: false,
          apiKeyFormat: "unknown",
        },
      })
      toast({
        title: "Diagnostic Failed",
        description: "Failed to run API diagnostics",
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  const getStatusIcon = (success: boolean) => {
    if (success) {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    }
    return <XCircle className="w-5 h-5 text-red-500" />
  }

  const getStatusBadge = (status: string | boolean) => {
    if (status === true || status === "valid") {
      return <Badge className="bg-green-600">✓ Good</Badge>
    }
    if (status === false || status === "invalid" || status === "missing") {
      return <Badge variant="destructive">✗ Issue</Badge>
    }
    return <Badge variant="secondary">{String(status)}</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="w-5 h-5 mr-2" />
          OpenAI API Diagnostics
        </CardTitle>
        <CardDescription>Test your OpenAI API configuration and connection</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={runDiagnostics} disabled={testing} className="w-full">
            <RefreshCw className={`w-4 h-4 mr-2 ${testing ? "animate-spin" : ""}`} />
            {testing ? "Running Diagnostics..." : "Run API Diagnostics"}
          </Button>

          {result && (
            <div className="space-y-4">
              {/* Overall Status */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(result.success)}
                  <span className="font-medium">{result.success ? "API Working" : "API Failed"}</span>
                </div>
                <span className="text-sm text-gray-600">{new Date(result.diagnostics.timestamp).toLocaleString()}</span>
              </div>

              {/* Success Message */}
              {result.success && result.response && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>API Response:</strong> {result.response}
                  </p>
                </div>
              )}

              {/* Error Message */}
              {!result.success && result.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Error:</strong> {result.error}
                  </p>
                </div>
              )}

              {/* Diagnostic Details */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Configuration Details</h4>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span>Environment:</span>
                    <Badge variant="outline">{result.diagnostics.environment}</Badge>
                  </div>

                  <div className="flex justify-between">
                    <span>API Key Present:</span>
                    {getStatusBadge(result.diagnostics.apiKeyPresent)}
                  </div>

                  <div className="flex justify-between">
                    <span>API Key Format:</span>
                    {getStatusBadge(result.diagnostics.apiKeyFormat)}
                  </div>

                  {result.diagnostics.apiKeyLength && (
                    <div className="flex justify-between">
                      <span>Key Length:</span>
                      <Badge variant="outline">{result.diagnostics.apiKeyLength} chars</Badge>
                    </div>
                  )}

                  {result.diagnostics.apiKeyPrefix && (
                    <div className="flex justify-between">
                      <span>Key Prefix:</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {result.diagnostics.apiKeyPrefix}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Troubleshooting Tips */}
              {!result.success && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Troubleshooting Tips:</h4>
                  <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                    <li>Ensure OPENAI_API_KEY is set in your environment variables</li>
                    <li>Verify your API key starts with "sk-" and is valid</li>
                    <li>Check that your OpenAI account has sufficient credits</li>
                    <li>Make sure you're not hitting rate limits</li>
                    <li>Try regenerating your API key in the OpenAI dashboard</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
