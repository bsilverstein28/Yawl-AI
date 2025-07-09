"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  History,
  Search,
  Trash2,
  Download,
  Eye,
  MessageSquare,
  Calendar,
  Clock,
  X,
  FileDown,
  Trash,
} from "lucide-react"
import {
  getChatSessions,
  deleteChatSession,
  clearAllChatHistory,
  exportChatSession,
  exportAllChatHistory,
  type ChatSession,
} from "@/lib/chat-storage"
import { useToast } from "@/hooks/use-toast"

interface ChatHistoryProps {
  onLoadChat?: (session: ChatSession) => void
}

export default function ChatHistory({ onLoadChat }: ChatHistoryProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const { toast } = useToast()

  // Load sessions on component mount
  useEffect(() => {
    loadSessions()
  }, [])

  // Filter sessions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSessions(sessions)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = sessions.filter(
        (session) =>
          session.title.toLowerCase().includes(query) ||
          session.messages.some((msg) => msg.content.toLowerCase().includes(query)),
      )
      setFilteredSessions(filtered)
    }
  }, [sessions, searchQuery])

  const loadSessions = () => {
    const loadedSessions = getChatSessions()
    setSessions(loadedSessions)
  }

  const handleDeleteSession = (sessionId: string) => {
    deleteChatSession(sessionId)
    loadSessions()
    toast({
      title: "Chat Deleted",
      description: "The chat session has been removed from your history.",
    })
  }

  const handleClearAllHistory = () => {
    clearAllChatHistory()
    loadSessions()
    toast({
      title: "History Cleared",
      description: "All chat history has been cleared.",
    })
  }

  const handleExportSession = (session: ChatSession) => {
    try {
      const jsonData = exportChatSession(session.id)
      const blob = new Blob([jsonData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `chat-${session.title.replace(/[^a-zA-Z0-9]/g, "-")}-${session.id}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Chat Exported",
        description: "Chat session has been downloaded as JSON.",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export chat session.",
        variant: "destructive",
      })
    }
  }

  const handleExportAll = () => {
    try {
      const jsonData = exportAllChatHistory()
      const blob = new Blob([jsonData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `yawlai-chat-history-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "History Exported",
        description: "All chat history has been downloaded as JSON.",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export chat history.",
        variant: "destructive",
      })
    }
  }

  const handleViewSession = (session: ChatSession) => {
    setSelectedSession(session)
    setIsViewDialogOpen(true)
  }

  const handleLoadChat = (session: ChatSession) => {
    if (onLoadChat) {
      onLoadChat(session)
      toast({
        title: "Chat Loaded",
        description: "Previous conversation has been loaded.",
      })
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const formatMessageContent = (content: string) => {
    // Remove HTML tags and truncate
    const plainText = content.replace(/<[^>]*>/g, "")
    return plainText.length > 100 ? plainText.substring(0, 100) + "..." : plainText
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <History className="w-6 h-6 mr-2" />
            Chat History
          </h2>
          <p className="text-gray-600 mt-1">
            {sessions.length} conversation{sessions.length !== 1 ? "s" : ""} saved
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleExportAll} variant="outline" size="sm">
            <FileDown className="w-4 h-4 mr-2" />
            Export All
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                <Trash className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear All Chat History?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your saved conversations. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAllHistory} className="bg-red-600 hover:bg-red-700">
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Chat Sessions List */}
      {filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <History className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {sessions.length === 0 ? "No Chat History" : "No Results Found"}
            </h3>
            <p className="text-gray-500 text-center max-w-md">
              {sessions.length === 0
                ? "Your conversations will appear here after you start chatting with YawlAI."
                : "Try adjusting your search terms to find the conversation you're looking for."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium text-gray-900 truncate">{session.title}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {session.messageCount} messages
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(session.updatedAt)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Updated {formatDate(session.updatedAt)}</span>
                      </div>
                    </div>

                    {/* Preview of last message */}
                    {session.messages.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">
                          {session.messages[session.messages.length - 1].role === "user" ? "You: " : "YawlAI: "}
                        </span>
                        {formatMessageContent(session.messages[session.messages.length - 1].content)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 ml-4">
                    <Button
                      onClick={() => handleViewSession(session)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    {onLoadChat && (
                      <Button
                        onClick={() => handleLoadChat(session)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    )}

                    <Button
                      onClick={() => handleExportSession(session)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Download className="w-4 h-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Chat?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{session.title}" and all its messages. This action cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteSession(session.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Chat Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedSession?.title}</span>
              <Button onClick={() => setIsViewDialogOpen(false)} variant="ghost" size="sm">
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              {selectedSession && (
                <div className="flex items-center space-x-4 text-sm">
                  <span>{selectedSession.messageCount} messages</span>
                  <span>•</span>
                  <span>Created {formatDate(selectedSession.createdAt)}</span>
                  <span>•</span>
                  <span>Updated {formatDate(selectedSession.updatedAt)}</span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {selectedSession?.messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-3 p-3 rounded-lg ${
                    message.role === "user" ? "bg-blue-50" : "bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                      message.role === "user" ? "bg-blue-500" : "bg-gray-500"
                    }`}
                  >
                    {message.role === "user" ? "U" : "AI"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm">{message.role === "user" ? "You" : "YawlAI"}</span>
                      <span className="text-xs text-gray-500">{message.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <div
                      className="text-sm text-gray-800 whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{
                        __html: message.role === "assistant" ? message.content : message.content.replace(/\n/g, "<br>"),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            {onLoadChat && selectedSession && (
              <Button
                onClick={() => {
                  handleLoadChat(selectedSession)
                  setIsViewDialogOpen(false)
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Continue Chat
              </Button>
            )}
            {selectedSession && (
              <Button onClick={() => handleExportSession(selectedSession)} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
