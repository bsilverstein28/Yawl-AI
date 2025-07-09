"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Upload, Plus, Search, Download, Edit, Trash2, RefreshCw, ExternalLink } from "lucide-react"

interface Keyword {
  id: number
  keyword: string
  target_url: string
  active: boolean
  created_at: string
  updated_at: string
}

export function KeywordManager() {
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [newKeyword, setNewKeyword] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null)
  const [editKeyword, setEditKeyword] = useState("")
  const [editUrl, setEditUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  // Load keywords on component mount
  useEffect(() => {
    loadKeywords()
  }, [])

  const loadKeywords = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/keywords")
      if (response.ok) {
        const data = await response.json()
        setKeywords(data.keywords || [])
      } else {
        throw new Error("Failed to load keywords")
      }
    } catch (error) {
      console.error("Error loading keywords:", error)
      toast({
        title: "Error",
        description: "Failed to load keywords. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addKeyword = async () => {
    if (!newKeyword.trim() || !newUrl.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter both keyword and URL.",
        variant: "destructive",
      })
      return
    }

    // Basic URL validation
    try {
      new URL(newUrl)
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL starting with http:// or https://",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: newKeyword.trim(),
          target_url: newUrl.trim(),
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Keyword added successfully!",
        })
        setNewKeyword("")
        setNewUrl("")
        loadKeywords()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to add keyword")
      }
    } catch (error) {
      console.error("Error adding keyword:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add keyword",
        variant: "destructive",
      })
    }
  }

  const updateKeyword = async () => {
    if (!editingKeyword || !editKeyword.trim() || !editUrl.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter both keyword and URL.",
        variant: "destructive",
      })
      return
    }

    // Basic URL validation
    try {
      new URL(editUrl)
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL starting with http:// or https://",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/keywords/${editingKeyword.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: editKeyword.trim(),
          target_url: editUrl.trim(),
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Keyword updated successfully!",
        })
        setEditingKeyword(null)
        setEditKeyword("")
        setEditUrl("")
        loadKeywords()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to update keyword")
      }
    } catch (error) {
      console.error("Error updating keyword:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update keyword",
        variant: "destructive",
      })
    }
  }

  const deleteKeyword = async (id: number) => {
    try {
      const response = await fetch(`/api/keywords/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Keyword deleted successfully!",
        })
        loadKeywords()
      } else {
        throw new Error("Failed to delete keyword")
      }
    } catch (error) {
      console.error("Error deleting keyword:", error)
      toast({
        title: "Error",
        description: "Failed to delete keyword. Please try again.",
        variant: "destructive",
      })
    }
  }

  const toggleKeywordStatus = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/keywords/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: isActive }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Keyword ${isActive ? "activated" : "deactivated"} successfully!`,
        })
        loadKeywords()
      } else {
        throw new Error("Failed to update keyword status")
      }
    } catch (error) {
      console.error("Error updating keyword status:", error)
      toast({
        title: "Error",
        description: "Failed to update keyword status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith(".csv") && !fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV or Excel file.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/keywords/bulk", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Upload Successful",
          description: result.message || `${result.inserted} keywords uploaded successfully!`,
        })
        loadKeywords()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to upload file")
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      // Reset file input
      event.target.value = ""
    }
  }

  const downloadTemplate = () => {
    const csvContent =
      "keyword,target_url\nexample keyword,https://example.com\nanother keyword,https://another-example.com"
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "keyword-template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const filteredKeywords = keywords.filter(
    (keyword) =>
      keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
      keyword.target_url.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const startEdit = (keyword: Keyword) => {
    setEditingKeyword(keyword)
    setEditKeyword(keyword.keyword)
    setEditUrl(keyword.target_url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Keyword Management</h2>
          <p className="text-gray-600">Manage keywords and their target URLs for ad integration</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={loadKeywords} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={downloadTemplate} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Template
          </Button>
        </div>
      </div>

      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manage">Manage Keywords</TabsTrigger>
          <TabsTrigger value="add">Add Keywords</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-4">
          {/* Search */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search keywords or URLs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary">
              {filteredKeywords.length} of {keywords.length} keywords
            </Badge>
          </div>

          {/* Keywords List */}
          <Card>
            <CardHeader>
              <CardTitle>Keywords ({filteredKeywords.length})</CardTitle>
              <CardDescription>Manage your keyword database for ad targeting</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-gray-600">Loading keywords...</p>
                </div>
              ) : filteredKeywords.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    {searchTerm
                      ? "No keywords match your search."
                      : "No keywords found. Add some keywords to get started."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredKeywords.map((keyword) => (
                    <div
                      key={keyword.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{keyword.keyword}</span>
                          <Badge variant={keyword.active ? "default" : "secondary"}>
                            {keyword.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                          <a
                            href={keyword.target_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline truncate"
                          >
                            {keyword.target_url}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Switch
                          checked={keyword.active}
                          onCheckedChange={(checked) => toggleKeywordStatus(keyword.id, checked)}
                        />
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => startEdit(keyword)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Keyword</DialogTitle>
                              <DialogDescription>Update the keyword and target URL.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="edit-keyword">Keyword</Label>
                                <Input
                                  id="edit-keyword"
                                  value={editKeyword}
                                  onChange={(e) => setEditKeyword(e.target.value)}
                                  placeholder="Enter keyword"
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-url">Target URL</Label>
                                <Input
                                  id="edit-url"
                                  value={editUrl}
                                  onChange={(e) => setEditUrl(e.target.value)}
                                  placeholder="https://example.com"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingKeyword(null)}>
                                Cancel
                              </Button>
                              <Button onClick={updateKeyword}>Update Keyword</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Keyword</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the keyword "{keyword.keyword}"? This action cannot be
                                undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteKeyword(keyword.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Add Individual Keyword */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Individual Keyword
                </CardTitle>
                <CardDescription>Add a single keyword with its target URL</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="keyword">Keyword</Label>
                  <Input
                    id="keyword"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Enter keyword"
                  />
                </div>
                <div>
                  <Label htmlFor="url">Target URL</Label>
                  <Input
                    id="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <Button onClick={addKeyword} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Keyword
                </Button>
              </CardContent>
            </Card>

            {/* Bulk Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Bulk Upload
                </CardTitle>
                <CardDescription>Upload multiple keywords from a CSV or Excel file</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Choose File</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Supported formats: CSV, Excel (.xlsx, .xls)</p>
                </div>
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-1">File format:</p>
                  <p>• Column 1: keyword</p>
                  <p>• Column 2: target_url</p>
                  <p>• First row should contain headers</p>
                </div>
                <Button onClick={downloadTemplate} variant="outline" className="w-full bg-transparent">
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
                {uploading && (
                  <div className="flex items-center justify-center py-2">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-600">Uploading...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
