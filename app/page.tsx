"use client"

import React from "react"

import { useState, useRef } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User, Settings, Paperclip, X, FileText, ImageIcon, AlertCircle } from "lucide-react"
import Link from "next/link"
import { processMessageWithAds } from "@/lib/ad-processor"
import { useToast } from "@/hooks/use-toast"

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, append, error } = useChat({
    api: "/api/chat",
    onError: (error) => {
      console.error("Chat error:", error)
      toast({
        title: "Chat Error",
        description: error.message || "Failed to get AI response. Please try again.",
        variant: "destructive",
      })
    },
  })

  const [processedMessages, setProcessedMessages] = useState<any[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [sessionId] = useState(() => Math.random().toString(36).substring(7))
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Process messages with ad links when they update
  React.useEffect(() => {
    const processMessages = async () => {
      try {
        const processed = await Promise.all(
          messages.map(async (message) => {
            if (message.role === "assistant") {
              const processedContent = await processMessageWithAds(message.content, sessionId)
              return { ...message, content: processedContent }
            }
            return message
          }),
        )
        setProcessedMessages(processed)
      } catch (error) {
        console.error("Error processing messages:", error)
        setProcessedMessages(messages)
      }
    }
    processMessages()
  }, [messages, sessionId])

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    setIsUploading(true)

    try {
      const validFiles = files.filter((file) => {
        const validTypes = [
          "text/plain",
          "text/markdown",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/csv",
          "application/json",
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
        ]
        const maxSize = 10 * 1024 * 1024 // 10MB

        if (!validTypes.includes(file.type)) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not a supported file type.`,
            variant: "destructive",
          })
          return false
        }

        if (file.size > maxSize) {
          toast({
            title: "File too large",
            description: `${file.name} is larger than 10MB.`,
            variant: "destructive",
          })
          return false
        }

        return true
      })

      if (validFiles.length > 0) {
        setUploadedFiles((prev) => [...prev, ...validFiles])
        toast({
          title: "Files uploaded",
          description: `${validFiles.length} file(s) ready to analyze.`,
        })
      }
    } catch (error) {
      console.error("Error uploading files:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // Remove uploaded file
  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Handle form submission with files
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() && uploadedFiles.length === 0) return

    let messageContent = input

    // Process uploaded files
    if (uploadedFiles.length > 0) {
      try {
        const fileContents = await Promise.all(
          uploadedFiles.map(async (file) => {
            if (file.type.startsWith("image/")) {
              return {
                name: file.name,
                type: "image",
                content: `[Image: ${file.name}]`,
              }
            } else {
              const text = await file.text()
              return {
                name: file.name,
                type: "document",
                content: text,
              }
            }
          }),
        )

        const fileContext = fileContents
          .map((file) => {
            if (file.type === "image") {
              return `**File: ${file.name}**\n${file.content}`
            }
            return `**File: ${file.name}**\n\`\`\`\n${file.content}\n\`\`\``
          })
          .join("\n\n")

        messageContent = `${input}\n\n**Uploaded Files:**\n${fileContext}`
      } catch (error) {
        console.error("Error processing files:", error)
        toast({
          title: "Error processing files",
          description: "Failed to read uploaded files.",
          variant: "destructive",
        })
        return
      }
    }

    // Send message with file content
    await append({
      role: "user",
      content: messageContent,
    })

    // Clear files after sending
    setUploadedFiles([])
  }

  // Test API connection
  const testAPIConnection = async () => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Hello, are you working?" }],
        }),
      })

      if (response.ok) {
        toast({
          title: "API Connection Test",
          description: "Chat API is working correctly!",
        })
      } else {
        const errorText = await response.text()
        toast({
          title: "API Connection Failed",
          description: `Error: ${response.status} - ${errorText}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "API Connection Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  // Function to format message content with proper markdown-like formatting
  const formatMessageContent = (content: string) => {
    let formatted = content

    // Convert **bold** to <strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

    // Convert *italic* to <em>
    formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>")

    // Convert code blocks
    formatted = formatted.replace(
      /```([\s\S]*?)```/g,
      '<pre class="bg-gray-100 p-3 rounded-md my-3 overflow-x-auto"><code>$1</code></pre>',
    )

    // Convert inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')

    // Convert bullet points (- or *) to proper HTML lists
    formatted = formatted.replace(/^[\s]*[-*]\s+(.+)$/gm, "<li>$1</li>")

    // Wrap consecutive <li> elements in <ul>
    formatted = formatted.replace(/(<li>.*<\/li>)/gs, (match) => {
      return `<ul class="list-disc list-inside space-y-1 my-3">${match}</ul>`
    })

    // Convert numbered lists (1. 2. etc.) to ordered lists
    formatted = formatted.replace(/^[\s]*\d+\.\s+(.+)$/gm, "<li>$1</li>")
    formatted = formatted.replace(/(<li>.*<\/li>)/gs, (match) => {
      if (!match.includes("list-disc")) {
        return `<ol class="list-decimal list-inside space-y-1 my-3">${match}</ol>`
      }
      return match
    })

    // Convert line breaks to proper paragraphs
    formatted = formatted.replace(/\n\n/g, '</p><p class="mb-4">')
    formatted = `<p class="mb-4">${formatted}</p>`

    // Clean up empty paragraphs
    formatted = formatted.replace(/<p class="mb-4"><\/p>/g, "")

    return formatted
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="w-4 h-4" />
    }
    return <FileText className="w-4 h-4" />
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              YawlAI
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={testAPIConnection} variant="outline" size="sm">
              <AlertCircle className="w-4 h-4 mr-2" />
              Test API
            </Button>
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Chat Error:</strong> {error.message}
              </p>
              <p className="text-xs text-red-600 mt-1">
                Please check your OpenAI API key configuration or try again later.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto">
          {processedMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
              <Bot className="w-16 h-16 mb-6 text-blue-500" />
              <h2 className="text-2xl font-semibold mb-3 text-gray-800">Welcome to YawlAI</h2>
              <p className="text-gray-600 text-center max-w-md">
                Your unrestricted AI assistant. Ask me anything or upload documents for analysis!
              </p>
            </div>
          )}

          {processedMessages.map((message, index) => (
            <div
              key={message.id}
              className={`w-full ${
                message.role === "user" ? "bg-gray-50" : "bg-white"
              } border-b border-gray-100 last:border-b-0`}
            >
              <div className="max-w-3xl mx-auto px-4 py-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback
                      className={message.role === "user" ? "bg-gray-600 text-white" : "bg-blue-500 text-white"}
                    >
                      {message.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {message.role === "user" ? "You" : "YawlAI"}
                      </span>
                    </div>
                    <div
                      className="text-gray-800 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: message.role === "assistant" ? formatMessageContent(message.content) : message.content,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="w-full bg-white border-b border-gray-100">
              <div className="max-w-3xl mx-auto px-4 py-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-blue-500 text-white">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="mb-1">
                      <span className="text-sm font-medium text-gray-900">YawlAI</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Form - Bottom Center */}
      <div className="border-t bg-white p-4">
        <div className="max-w-3xl mx-auto">
          {/* Uploaded Files Display */}
          {uploadedFiles.length > 0 && (
            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</div>
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-white px-3 py-2 rounded-md border text-sm">
                    {getFileIcon(file)}
                    <span className="truncate max-w-32">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="relative">
            <div className="flex items-center bg-white border border-gray-300 rounded-xl shadow-sm focus-within:shadow-md transition-shadow">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Message YawlAI..."
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-3 text-base text-gray-900 placeholder-gray-500"
                disabled={isLoading}
              />
              <div className="flex items-center space-x-1 mr-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isUploading}
                  className="rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
                  size="sm"
                  className="rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 disabled:opacity-50 border-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </form>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.md,.pdf,.doc,.docx,.csv,.json,.jpg,.jpeg,.png,.gif,.webp"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>
    </div>
  )
}
