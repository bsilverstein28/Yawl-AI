"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User, AlertCircle, Plus, Wifi, WifiOff, History } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { processMessageWithAds } from "@/lib/ad-processor"
import { useToast } from "@/hooks/use-toast"
import { ChatStorage, type ChatMessage, type ChatSession } from "@/lib/chat-storage"

// Global function to track keyword clicks
declare global {
  interface Window {
    trackKeywordClick: (keyword: string, targetUrl: string, userSession: string) => void
  }
}

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, append, error, setInput, setMessages } = useChat(
    {
      api: "/api/chat",
      // Optimize chat settings for better performance
      streamMode: "text",
      keepLastMessageOnError: true,
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
        } else if (error.message?.includes("timeout") || error.message?.includes("network")) {
          errorDescription = "Request timed out. Please check your connection and try again."
        }

        toast({
          title: "Chat Error",
          description: `${errorMessage}. ${errorDescription}`,
          variant: "destructive",
        })
      },
      onFinish: (message) => {
        console.log("✅ Message completed:", message.content.length, "characters")
        // Save chat session after each completed message
        saveCurrentChat()
      },
    },
  )

  const [processedMessages, setProcessedMessages] = useState<any[]>([])
  const [processingAds, setProcessingAds] = useState(false)
  const [sessionId] = useState(() => Math.random().toString(36).substring(7))
  const [connectionStatus, setConnectionStatus] = useState<"online" | "offline">("online")
  const [currentChatId, setCurrentChatId] = useState<string>("")
  const { toast } = useToast()

  // Monitor connection status
  React.useEffect(() => {
    const handleOnline = () => setConnectionStatus("online")
    const handleOffline = () => setConnectionStatus("offline")

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Check for chat session to load on page load
  useEffect(() => {
    const loadSessionData = sessionStorage.getItem("loadChatSession")
    if (loadSessionData) {
      try {
        const session: ChatSession = JSON.parse(loadSessionData)
        // Convert the stored messages to the format expected by useChat
        const chatMessages = session.messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.timestamp,
        }))
        setMessages(chatMessages)
        setCurrentChatId(session.id)
        sessionStorage.removeItem("loadChatSession")

        toast({
          title: "Chat Loaded",
          description: `Loaded "${session.title}" with ${session.messages.length} messages.`,
        })
      } catch (error) {
        console.error("Error loading chat session:", error)
        toast({
          title: "Load Error",
          description: "Failed to load the selected chat session.",
          variant: "destructive",
        })
      }
    }
  }, [setMessages, toast])

  // Save current chat session
  const saveCurrentChat = () => {
    if (messages.length === 0) return

    const chatMessages: ChatMessage[] = messages.map((msg) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant",
      content: msg.content,
      timestamp: msg.createdAt || new Date(),
    }))

    // Create or update session
    if (currentChatId) {
      // Update existing session
      const existingSessions = ChatStorage.getSessions()
      const existingSession = existingSessions.find((s) => s.id === currentChatId)
      if (existingSession) {
        const updatedSession: ChatSession = {
          ...existingSession,
          messages: chatMessages,
          updatedAt: new Date(),
          title: chatMessages.length > 0 ? ChatStorage.generateTitle(chatMessages[0].content) : existingSession.title,
        }
        ChatStorage.saveSession(updatedSession)
      }
    } else {
      // Create new session
      const newSession = ChatStorage.createSession(chatMessages)
      ChatStorage.saveSession(newSession)
      setCurrentChatId(newSession.id)
    }
  }

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
          has_files: false,
          file_count: 0,
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
    // Save current chat before starting new one
    if (messages.length > 0) {
      saveCurrentChat()
    }

    // Clear all messages and reset the chat
    setMessages([])
    setProcessedMessages([])
    setInput("")
    setCurrentChatId("")

    toast({
      title: "New Chat Started",
      description: "Previous conversation has been saved to history.",
    })
  }

  // Optimized ad processing - only process when messages change and not loading
  useEffect(() => {
    const processMessages = async () => {
      if (messages.length === 0) {
        setProcessedMessages([])
        return
      }

      // Don't process ads while still loading to avoid interrupting the stream
      if (isLoading) {
        setProcessedMessages(messages)
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

    // Add a small delay to avoid processing while streaming
    const timeoutId = setTimeout(processMessages, isLoading ? 0 : 500)
    return () => clearTimeout(timeoutId)
  }, [messages, isLoading, sessionId, toast])

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    // Check connection status
    if (connectionStatus === "offline") {
      toast({
        title: "No Internet Connection",
        description: "Please check your internet connection and try again.",
        variant: "destructive",
      })
      return
    }

    // Track the chat question
    await trackChatQuestion(input)

    // Send message
    await append({
      role: "user",
      content: input,
    })

    // Clear the input field after sending
    setInput("")
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
          <div className="flex items-center space-x-2">
            {/* Connection Status Indicator */}
            <div className="flex items-center space-x-1">
              {connectionStatus === "online" ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
            </div>
            {processingAds && <div className="text-xs text-blue-600 animate-pulse">Processing ads...</div>}
            <Link href="/history">
              <Button variant="outline" size="sm" className="bg-transparent">
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
            </Link>
            <Button onClick={startNewChat} variant="outline" size="sm" className="bg-transparent">
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
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
              <div className="py-6 sm:py-8">
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
              <div className="py-6 sm:py-8">
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
          <form onSubmit={handleFormSubmit} className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder={connectionStatus === "offline" ? "No internet connection..." : "Ask YawlAI anything..."}
                disabled={isLoading || connectionStatus === "offline"}
                className="py-3 text-base resize-none min-h-[48px] bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleFormSubmit(e)
                  }
                }}
              />
            </div>
            <Button
              type="submit"
              disabled={!input.trim() || isLoading || connectionStatus === "offline"}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>

          <div className="text-xs text-gray-500 mt-2 text-center">
            YawlAI can make mistakes. Please verify important information.
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center space-y-4">
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-600">
              <span>© 2024 YawlAI</span>
              <span>•</span>
              <span>Set Sail with YawlAI, Your Free AI Assistant</span>
            </div>
            <div className="flex justify-center">
              <Link href="/admin" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
