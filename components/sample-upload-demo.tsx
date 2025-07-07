"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Upload, CheckCircle, FileText, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SampleKeyword {
  keyword: string
  url: string
  status: "ready" | "uploading" | "success" | "error"
}

export default function SampleUploadDemo() {
  const [sampleData] = useState<SampleKeyword[]>([
    { keyword: "Nike", url: "https://nike.com/special-offer", status: "ready" },
    { keyword: "Apple", url: "https://apple.com/deals", status: "ready" },
    { keyword: "Tesla", url: "https://tesla.com/referral", status: "ready" },
    { keyword: "Amazon", url: "https://amazon.com/prime", status: "ready" },
    { keyword: "Google", url: "https://google.com/workspace", status: "ready" },
    { keyword: "Microsoft", url: "https://microsoft.com/office365", status: "ready" },
    { keyword: "Samsung", url: "https://samsung.com/galaxy", status: "ready" },
    { keyword: "Adobe", url: "https://adobe.com/creative-cloud", status: "ready" },
    { keyword: "Netflix", url: "https://netflix.com/subscribe", status: "ready" },
    { keyword: "Spotify", url: "https://spotify.com/premium", status: "ready" },
  ])

  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [uploadedKeywords, setUploadedKeywords] = useState<SampleKeyword[]>([])
  const { toast } = useToast()

  const downloadSampleCSV = () => {
    const csvContent = ["keyword,url", ...sampleData.map((item) => `${item.keyword},${item.url}`)].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sample-keywords.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast({
      title: "Sample CSV Downloaded",
      description: "You can now upload this file to test the functionality.",
    })
  }

  const simulateUpload = async () => {
    setUploadStatus("uploading")
    setUploadedKeywords([])

    // Simulate processing each keyword
    for (let i = 0; i < sampleData.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 300))

      const keyword = { ...sampleData[i], status: "success" as const }
      setUploadedKeywords((prev) => [...prev, keyword])
    }

    setUploadStatus("success")
    toast({
      title: "Upload Simulation Complete",
      description: `Successfully processed ${sampleData.length} keywords from the sample file.`,
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ready":
        return <Badge variant="outline">Ready</Badge>
      case "uploading":
        return <Badge variant="secondary">Processing...</Badge>
      case "success":
        return (
          <Badge variant="default" className="bg-green-600">
            Success
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Sample File Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Sample Keywords File Preview
          </CardTitle>
          <CardDescription>
            This is what your CSV/Excel file should look like. Download this sample to test the upload functionality.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-mono">
                <div className="font-bold border-b pb-2 mb-2">keyword,url</div>
                {sampleData.slice(0, 5).map((item, index) => (
                  <div key={index} className="py-1">
                    {item.keyword},{item.url}
                  </div>
                ))}
                <div className="text-gray-500 italic">... and {sampleData.length - 5} more rows</div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button onClick={downloadSampleCSV} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Sample CSV
              </Button>
              <Button onClick={simulateUpload} disabled={uploadStatus === "uploading"}>
                <Upload className="w-4 h-4 mr-2" />
                {uploadStatus === "uploading" ? "Simulating Upload..." : "Simulate Upload"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Results */}
      {uploadedKeywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Upload Results
            </CardTitle>
            <CardDescription>
              {uploadStatus === "success"
                ? `Successfully processed ${uploadedKeywords.length} keywords`
                : `Processing... ${uploadedKeywords.length}/${sampleData.length} complete`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Target URL</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadedKeywords.map((keyword, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{keyword.keyword}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        <a
                          href={keyword.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {keyword.url}
                        </a>
                      </TableCell>
                      <TableCell>{getStatusBadge(keyword.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Format Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
            File Format Requirements
          </CardTitle>
          <CardDescription>Follow these guidelines to ensure successful uploads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600">✅ Supported Formats</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• CSV files (.csv)</li>
                  <li>• Excel files (.xlsx, .xls)</li>
                  <li>• UTF-8 encoding recommended</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-600">📋 Required Columns</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• "keyword" column (case insensitive)</li>
                  <li>• "url" or "link" column</li>
                  <li>• Header row required</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">💡 Pro Tips</h4>
              <ul className="text-sm space-y-1 text-blue-700">
                <li>• Keywords are case-insensitive when matching in AI responses</li>
                <li>• URLs should include the full protocol (https://)</li>
                <li>• Duplicate keywords will update existing entries</li>
                <li>• Empty rows are automatically skipped</li>
                <li>• Special characters in keywords are supported</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
