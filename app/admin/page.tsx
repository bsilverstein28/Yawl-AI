"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, Plus, Trash2, Download, ArrowLeft, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import type { Keyword } from "@/lib/database.types"
import { handleFileUpload, generateTemplate, type KeywordUpload } from "@/lib/file-upload"

export default function AdminPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [newKeyword, setNewKeyword] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const { toast } = useToast()

  // Fetch keywords from database
  useEffect(() => {
    fetchKeywords()
  }, [])

  const fetchKeywords = async () => {
    try {
      const response = await fetch("/api/keywords")
      const data = await response.json()
      setKeywords(data)
    } catch (error) {
      console.error("Error fetching keywords:", error)
      toast({
        title: "Error",
        description: "Failed to fetch keywords",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addKeyword = async () => {
    if (newKeyword && newUrl) {
      try {
        const response = await fetch("/api/keywords", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keyword: newKeyword,
            target_url: newUrl,
            active: true,
          }),
        })

        if (response.ok) {
          const newKeywordData = await response.json()
          setKeywords([newKeywordData, ...keywords])
          setNewKeyword("")
          setNewUrl("")
          toast({
            title: "Keyword added",
            description: `${newKeyword} has been added to the database.`,
          })
        } else {
          throw new Error("Failed to add keyword")
        }
      } catch (error) {
        console.error("Error adding keyword:", error)
        toast({
          title: "Error",
          description: "Failed to add keyword",
          variant: "destructive",
        })
      }
    }
  }

  const deleteKeyword = async (id: number) => {
    try {
      const response = await fetch(`/api/keywords?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setKeywords(keywords.filter((k) => k.id !== id))
        toast({
          title: "Keyword deleted",
          description: "The keyword has been removed from the database.",
        })
      } else {
        throw new Error("Failed to delete keyword")
      }
    } catch (error) {
      console.error("Error deleting keyword:", error)
      toast({
        title: "Error",
        description: "Failed to delete keyword",
        variant: "destructive",
      })
    }
  }

  const toggleKeyword = async (id: number) => {
    const keyword = keywords.find((k) => k.id === id)
    if (!keyword) return

    try {
      const response = await fetch("/api/keywords", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          keyword: keyword.keyword,
          target_url: keyword.target_url,
          active: !keyword.active,
        }),
      })

      if (response.ok) {
        const updatedKeyword = await response.json()
        setKeywords(keywords.map((k) => (k.id === id ? updatedKeyword : k)))
      } else {
        throw new Error("Failed to update keyword")
      }
    } catch (error) {
      console.error("Error updating keyword:", error)
      toast({
        title: "Error",
        description: "Failed to update keyword",
        variant: "destructive",
      })
    }
  }

  const handleBulkUpload = async (uploadedKeywords: KeywordUpload[]) => {
    setUploading(true)
    setUploadProgress(0)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 100)

      const response = await fetch("/api/keywords/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: uploadedKeywords }),
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        const result = await response.json()

        toast({
          title: "Upload successful",
          description: `${result.inserted} keywords uploaded successfully. ${result.errors > 0 ? `${result.errors} errors occurred.` : ""}`,
        })

        // Refresh keywords list
        await fetchKeywords()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }
    } catch (error) {
      console.error("Error uploading keywords:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload keywords",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(
      event,
      (uploadedKeywords) => {
        handleBulkUpload(uploadedKeywords)
      },
      (error) => {
        toast({
          title: "File processing error",
          description: error,
          variant: "destructive",
        })
      },
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading keywords...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" className="mb-4 bg-transparent">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Chat
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage advertising keywords and URLs</p>

          {/* Brand CSV Upload Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileSpreadsheet className="w-5 h-5 mr-2" />
                Brand CSV Upload
              </CardTitle>
              <CardDescription>Process the 100-brand CSV file and upload all keywords at once</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/brand-upload">
                <Button className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Process Brand CSV File
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileSpreadsheet className="w-5 h-5 mr-2" />
                Bulk Upload Keywords
              </CardTitle>
              <CardDescription>Upload a CSV or Excel file with keywords and URLs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Click to upload or drag and drop</span>
                    <br />
                    <span className="text-xs text-gray-500">CSV, XLSX, or XLS files</span>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                  </Label>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Uploading keywords...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}

                <Button onClick={generateTemplate} className="w-full bg-transparent" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>
                    <strong>File format:</strong> Your file should have columns named "keyword" and "url"
                  </p>
                  <p>
                    <strong>Example:</strong> Nike → https://nike.com/special-offer
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manual Add */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Keyword</CardTitle>
              <CardDescription>Manually add a keyword and its associated URL</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="keyword">Keyword</Label>
                  <Input
                    id="keyword"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="e.g., Nike"
                  />
                </div>
                <div>
                  <Label htmlFor="url">Target URL</Label>
                  <Input
                    id="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://example.com/offer"
                  />
                </div>
                <Button onClick={addKeyword} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Keyword
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Keywords Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Keywords ({keywords.length})</span>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{keywords.filter((k) => k.active).length} active</span>
                <AlertCircle className="w-4 h-4 text-gray-400" />
                <span>{keywords.filter((k) => !k.active).length} inactive</span>
              </div>
            </CardTitle>
            <CardDescription>Manage your advertising keywords and their target URLs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Target URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keywords.map((keyword) => (
                    <TableRow key={keyword.id}>
                      <TableCell className="font-medium">{keyword.keyword}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        <a
                          href={keyword.target_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {keyword.target_url}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={keyword.active ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => toggleKeyword(keyword.id)}
                        >
                          {keyword.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(keyword.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => deleteKeyword(keyword.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
