"use client"

import React from "react"

import { useState, useRef } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User, Settings, Paperclip, X, FileText, ImageIcon, AlertCircle, Plus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { processMessageWithAds } from "@/lib/ad-processor"
import { useToast } from "@/hooks/use-toast"

// Global function to track keyword clicks
declare global {
  interface Window {
    trackKeywordClick: (keyword: string, targetUrl: string, userSession: string) => void
  }
}

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, append, error, setInput } = useChat({
    api: "/api/chat",
    onError: (error) => {
      console.error("Chat error:", error)

      // Parse error message for better user feedback
      const errorMessage = error.message || "Failed to get AI response"
      let errorDescription = "Please try again later."

      if (error.message?.includes("API key")) {
        errorDescription = "Please check your OpenAI API key configuration in the admin panel."
      } else if (error.message?.includes("quota") || error.message?.includes("billing")) {
        errorDescription = "Your OpenAI API quota has been exceeded. Please check your billing."
      } else if (error.message?.includes("rate limit")) {
        errorDescription = "Too many requests. Please wait a moment and try again."
      }

      toast({
        title: "Chat Error",
        description: `${errorMessage}. ${errorDescription}`,
        variant: "destructive",
      })
    },
  })

  const [processedMessages, setProcessedMessages] = useState<any[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [processingAds, setProcessingAds] = useState(false)
  const [sessionId] = useState(() => Math.random().toString(36).substring(7))
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Track chat questions/prompts
  const trackChatQuestion = async (question: string) => {
    try {
      await fetch("/api/track-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          user_session: sessionId,
          query_text: question,
          has_files: uploadedFiles.length > 0,
          file_count: uploadedFiles.length,
        }),
      })
      console.log("📊 Tracked chat question")
    } catch (error) {
      console.error("Error tracking chat question:", error)
    }
  }

  // Set up global click tracking function
  React.useEffect(() => {
    window.trackKeywordClick = async (keyword: string, targetUrl: string, userSession: string) => {
      try {
        console.log(`🖱️ Tracking click for keyword: ${keyword}`)

        await fetch("/api/track-click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keyword,
            target_url: targetUrl,
            user_session: userSession,
          }),
        })

        console.log(`✅ Click tracked for keyword: ${keyword}`)
      } catch (error) {
        console.error("Error tracking keyword click:", error)
      }
    }

    return () => {
      // Cleanup
      delete window.trackKeywordClick
    }
  }, [])

  const startNewChat = () => {
    // Clear all messages and reset the chat
    setProcessedMessages([])
    setUploadedFiles([])
    setInput("")

    // Reset the useChat hook by reloading the page or using a more elegant solution
    window.location.reload()
  }

  // Process messages with ad links when they update
  React.useEffect(() => {
    const processMessages = async () => {
      if (messages.length === 0) {
        setProcessedMessages([])
        return
      }

      setProcessingAds(true)
      console.log("Processing", messages.length, "messages for ads...")

      try {
        const processed = await Promise.all(
          messages.map(async (message, index) => {
            if (message.role === "assistant") {
              console.log(`Processing assistant message ${index + 1}...`)
              const processedContent = await processMessageWithAds(message.content, sessionId)
              return { ...message, content: processedContent }
            }
            return message
          }),
        )

        console.log("All messages processed successfully")
        setProcessedMessages(processed)
      } catch (error) {
        console.error("Error processing messages:", error)
        setProcessedMessages(messages) // Fallback to original messages
        toast({
          title: "Ad Processing Error",
          description: "Failed to process keyword links. Messages will display without links.",
          variant: "destructive",
        })
      } finally {
        setProcessingAds(false)
      }
    }

    processMessages()
  }, [messages, sessionId, toast])

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

    // Track the chat question
    await trackChatQuestion(input)

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

    // Clear the input field and uploaded files after sending
    setInput("")
    setUploadedFiles([])
  }

  // Enhanced function to format message content with modern typography
  const formatMessageContent = (content: string) => {
    let formatted = content

    // Convert headings with proper hierarchy and modern styling
    formatted = formatted.replace(
      /^### (.*$)/gm,
      '<h3 class="text-lg font-semibold text-gray-900 mt-6 mb-3 border-l-4 border-blue-500 pl-4">$1</h3>',
    )
    formatted = formatted.replace(
      /^## (.*$)/gm,
      '<h2 class="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">$1</h2>',
    )
    formatted = formatted.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-gray-900 mt-8 mb-6">$1</h1>')

    // Convert **bold** to modern strong styling
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')

    // Convert *italic* to modern em styling
    formatted = formatted.replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')

    // Convert code blocks with modern styling
    formatted = formatted.replace(
      /```([\s\S]*?)```/g,
      '<div class="my-4"><pre class="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto text-sm font-mono leading-relaxed"><code class="text-gray-800">$1</code></pre></div>',
    )

    // Convert inline code with modern styling
    formatted = formatted.replace(
      /`([^`]+)`/g,
      '<code class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono border">$1</code>',
    )

    // Handle nested lists - first convert all list items
    // Convert main bullet points (- or * at start of line)
    formatted = formatted.replace(/^[\s]*[-*]\s+(.+)$/gm, '<li class="main-bullet">$1</li>')

    // Convert sub bullet points (  - or   * with indentation)
    formatted = formatted.replace(/^[\s]{2,}[-*]\s+(.+)$/gm, '<li class="sub-bullet">$1</li>')

    // Convert numbered lists
    formatted = formatted.replace(/^[\s]*(\d+)\.\s+(.+)$/gm, '<li class="numbered-item" data-number="$1">$2</li>')

    // Group consecutive list items into proper lists
    // Handle main bullet lists
    formatted = formatted.replace(
      /(<li class="main-bullet">.*?<\/li>(?:\s*<li class="(?:main-bullet|sub-bullet)">.*?<\/li>)*)/gs,
      (match) => {
        // Split into main and sub items
        const items = match
          .split("</li>")
          .filter((item) => item.trim())
          .map((item) => item + "</li>")
        let result = '<ul class="space-y-2 my-4 ml-0">'

        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          if (item.includes('class="main-bullet"')) {
            const content = item.replace('<li class="main-bullet">', "").replace("</li>", "")
            result += `<li class="flex items-start space-x-3"><div class="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div><div class="flex-1 text-gray-800 leading-relaxed">${content}</div></li>`

            // Check for sub-bullets that follow
            const subItems = []
            while (i + 1 < items.length && items[i + 1].includes('class="sub-bullet"')) {
              i++
              const subContent = items[i].replace('<li class="sub-bullet">', "").replace("</li>", "")
              subItems.push(subContent)
            }

            if (subItems.length > 0) {
              result += '<li><ul class="space-y-1 mt-2 ml-5">'
              subItems.forEach((subItem) => {
                result += `<li class="flex items-start space-x-2"><div class="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div><div class="flex-1 text-gray-700 text-sm leading-relaxed">${subItem}</div></li>`
              })
              result += "</ul></li>"
            }
          }
        }
        result += "</ul>"
        return result
      },
    )

    // Handle numbered lists
    formatted = formatted.replace(
      /(<li class="numbered-item".*?<\/li>(?:\s*<li class="numbered-item".*?<\/li>)*)/gs,
      (match) => {
        const items = match
          .split("</li>")
          .filter((item) => item.trim())
          .map((item) => item + "</li>")
        let result = '<ol class="space-y-2 my-4 ml-0 counter-reset-list">'

        items.forEach((item) => {
          const numberMatch = item.match(/data-number="(\d+)"/)
          const number = numberMatch ? numberMatch[1] : "1"
          const content = item.replace(/<li class="numbered-item".*?>/, "").replace("</li>", "")
          result += `<li class="flex items-start space-x-3"><div class="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">${number}</div><div class="flex-1 text-gray-800 leading-relaxed">${content}</div></li>`
        })

        result += "</ol>"
        return result
      },
    )

    // Clean up any remaining list markup
    formatted = formatted.replace(/<li class="(main-bullet|sub-bullet|numbered-item)"[^>]*>/g, "")
    formatted = formatted.replace(/<\/li>/g, "")

    // Convert line breaks to proper paragraphs with modern spacing
    formatted = formatted.replace(/\n\n/g, '</p><p class="mb-4 text-gray-800 leading-relaxed">')
    formatted = `<div class="prose-custom"><p class="mb-4 text-gray-800 leading-relaxed">${formatted}</p></div>`

    // Clean up empty paragraphs and extra spacing
    formatted = formatted.replace(/<p class="mb-4 text-gray-800 leading-relaxed"><\/p>/g, "")
    formatted = formatted.replace(/<p class="mb-4 text-gray-800 leading-relaxed">\s*<\/p>/g, "")

    // Fix spacing around headings and lists
    formatted = formatted.replace(/(<\/(?:h1|h2|h3)>)\s*<p class="mb-4 text-gray-800 leading-relaxed">/g, "$1")
    formatted = formatted.replace(/(<\/(?:ul|ol)>)\s*<p class="mb-4 text-gray-800 leading-relaxed">/g, "$1")

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
      {/* Header - Updated with new logo */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 flex items-center justify-center">
              <Image
                src="/yawlai-logo.png"
                alt="YawlAI Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              YawlAI
            </h1>
          </Link>
          {processingAds && <div className="text-xs text-blue-600 animate-pulse">Processing ads...</div>}
          <div className="flex items-center space-x-2">
            <Button onClick={startNewChat} variant="outline" size="sm" className="bg-transparent">
              <Plus className="w-4 h-4 mr-2" />
              New Chat
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
              <div className="mt-2 flex space-x-2">
                <Link href="/admin/api-diagnostics">
                  <Button size="sm" variant="outline" className="text-xs bg-transparent">
                    Check API Configuration
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto">
          {processedMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
              <div className="w-20 h-20 mb-6 flex items-center justify-center">
                <Image
                  src="/yawlai-logo.png"
                  alt="YawlAI Logo"
                  width={80}
                  height={80}
                  className="w-full h-full object-contain"
                />
              </div>
              <h2 className="text-2xl font-semibold mb-3 text-gray-800">Welcome to YawlAI</h2>
              <p className="text-gray-600 text-center max-w-md">Set Sail with YawlAI, Your Free AI Assistant</p>
            </div>
          )}

          {processedMessages.map((message, index) => (
            <div
              key={message.id}
              className={`w-full ${
                message.role === "user" ? "bg-gray-50/50" : "bg-white"
              } border-b border-gray-100 last:border-b-0`}
            >
              <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="flex items-start space-x-4">
                  <Avatar className="w-9 h-9 flex-shrink-0">
                    <AvatarFallback
                      className={message.role === "user" ? "bg-gray-600 text-white" : "bg-blue-500 text-white"}
                    >
                      {message.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {message.role === "user" ? "You" : "YawlAI"}
                      </span>
                    </div>
                    <div
                      className="text-gray-800 leading-relaxed max-w-none"
                      dangerouslySetInnerHTML={{
                        __html:
                          message.role === "assistant"
                            ? formatMessageContent(message.content)
                            : `<p class="text-gray-800 leading-relaxed whitespace-pre-wrap">${message.content}</p>`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="w-full bg-white border-b border-gray-100">
              <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="flex items-start space-x-4">
                  <Avatar className="w-9 h-9 flex-shrink-0">
                    <AvatarFallback className="bg-blue-500 text-white">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="mb-2">
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
      <div className="border-t bg-white p-4 mb-4">
        <div className="max-w-4xl mx-auto">
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
