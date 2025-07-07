"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, CheckCircle, AlertCircle, Download, ExternalLink, Database, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BrandKeyword {
  keyword: string
  target_url: string
  active: boolean
  status?: "pending" | "success" | "error"
  error?: string
}

export default function BrandCSVUploader() {
  const [keywords, setKeywords] = useState<BrandKeyword[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResults, setUploadResults] = useState<any>(null)
  const { toast } = useToast()

  const fetchAndProcessCSV = async () => {
    setLoading(true)
    setKeywords([])

    try {
      const response = await fetch(
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Brand%20test%20-%20Sheet1-ICvpqRd9AXv7bGRGR7thTZsUxktsg4.csv",
      )
      const csvText = await response.text()

      // Parse CSV
      const lines = csvText.split("\n").filter((line) => line.trim())
      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

      const keywordIndex = headers.findIndex((h) => h.toLowerCase().includes("keyword"))
      const urlIndex = headers.findIndex((h) => h.toLowerCase().includes("url"))

      if (keywordIndex === -1 || urlIndex === -1) {
        throw new Error("Could not find keyword or URL columns")
      }

      const processedKeywords: BrandKeyword[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))

        if (values.length > keywordIndex && values.length > urlIndex) {
          const keyword = values[keywordIndex]
          const url = values[urlIndex]

          if (keyword && url) {
            try {
              new URL(url) // Validate URL
              processedKeywords.push({
                keyword: keyword,
                target_url: url,
                active: true,
                status: "pending",
              })
            } catch {
              processedKeywords.push({
                keyword: keyword,
                target_url: url,
                active: false,
                status: "error",
                error: "Invalid URL format",
              })
            }
          }
        }
      }

      setKeywords(processedKeywords)

      toast({
        title: "CSV Processed Successfully",
        description: `Found ${processedKeywords.length} brand keywords ready for upload.`,
      })
    } catch (error) {
      console.error("Error processing CSV:", error)
      toast({
        title: "Processing Failed",
        description: "Failed to fetch or process the CSV file.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const uploadKeywords = async () => {
    if (keywords.length === 0) return

    setUploading(true)
    setUploadProgress(0)
    setUploadResults(null)

    try {
      const validKeywords = keywords.filter((k) => k.status !== "error")

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 5, 90))
      }, 200)

      const response = await fetch("/api/keywords/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: validKeywords }),
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        const result = await response.json()
        setUploadResults(result)

        toast({
          title: "Upload Successful",
          description: `${result.inserted} brand keywords uploaded successfully!`,
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload keywords",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 2000)
    }
  }

  const validKeywords = keywords.filter((k) => k.status !== "error")
  const errorKeywords = keywords.filter((k) => k.status === "error")

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Brand CSV Processor
          </CardTitle>
          <CardDescription>Process the 100-brand CSV file and upload keywords to the database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button onClick={fetchAndProcessCSV} disabled={loading} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              {loading ? "Processing CSV..." : "Fetch & Process CSV"}
            </Button>

            <Button onClick={uploadKeywords} disabled={uploading || keywords.length === 0}>
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? "Uploading..." : `Upload ${validKeywords.length} Keywords`}
            </Button>
          </div>

          {uploading && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading brand keywords...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      {keywords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{keywords.length}</p>
                  <p className="text-sm text-gray-600">Total Brands</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{validKeywords.length}</p>
                  <p className="text-sm text-gray-600">Valid Keywords</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{errorKeywords.length}</p>
                  <p className="text-sm text-gray-600">Errors</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-purple-600">{uploadResults ? uploadResults.inserted : 0}</p>
                  <p className="text-sm text-gray-600">Uploaded</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload Results */}
      {uploadResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <CheckCircle className="w-5 h-5 mr-2" />
              Upload Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Successfully Uploaded:</span>
                <span className="ml-2 text-green-600 font-bold">{uploadResults.inserted}</span>
              </div>
              <div>
                <span className="font-medium">Errors:</span>
                <span className="ml-2 text-red-600 font-bold">{uploadResults.errors}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keywords Preview */}
      {keywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Brand Keywords Preview</CardTitle>
            <CardDescription>Preview of processed brand keywords from the CSV file</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand</TableHead>
                    <TableHead>Target URL</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keywords.map((keyword, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{keyword.keyword}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="flex items-center space-x-2">
                          <span className="truncate">{keyword.target_url}</span>
                          <a
                            href={keyword.target_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            keyword.status === "success"
                              ? "default"
                              : keyword.status === "error"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {keyword.status === "error" ? keyword.error : keyword.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
