"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Search, Trash2, Download, Eye, MessageSquare, Calendar, RotateCcw } from "lucide-react"
import { ChatStorage, type ChatSession } from "@/lib/chat-storage"
import { useToast } from "@/hooks/use-toast"

interface ChatHistoryProps {
  onLoadChat?: (session: ChatSession) => void
}

export default function ChatHistory({ onLoadChat }: ChatHistoryProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = () => {
    const loadedSessions = ChatStorage.getSessions()
    setSessions(loadedSessions)
  }

  const filteredSessions = sessions.filter(
    (session) =>
      session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.messages.some((msg) => msg.content.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const deleteSession = (sessionId: string) => {
    ChatStorage.deleteSession(sessionId)
    setSessions(sessions.filter((s) => s.id !== sessionId))
    toast({
      title: "Chat Deleted",
      description: "The chat session has been deleted successfully.",
    })
  }

  const clearAllHistory = () => {
    ChatStorage.clearAllSessions()
    setSessions([])
    toast({
      title: "History Cleared",
      description: "All chat history has been cleared.",
    })
  }

  const exportSession = (sessionId: string) => {
    const exported = ChatStorage.exportSession(sessionId)
    if (exported) {
      const blob = new Blob([exported], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `chat-${sessionId}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Chat Exported",
        description: "The chat has been downloaded as a JSON file.",
      })
    }
  }

  const exportAllSessions = () => {
    const exported = ChatStorage.exportAllSessions()
    const blob = new Blob([exported], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `all-chats-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "All Chats Exported",
      description: "All chat history has been downloaded as a JSON file.",
    })
  }

  const loadChat = (session: ChatSession) => {
    if (onLoadChat) {
      onLoadChat(session)
      toast({
        title: "Chat Loaded",
        description: `Loaded chat: ${session.title}`,
      })
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "Today"
    if (diffDays === 2) return "Yesterday"
    if (diffDays <= 7) return `${diffDays - 1} days ago`

    return date.toLocaleDateString()
  }

  const getLastMessage = (session: ChatSession) => {
    const lastMessage = session.messages[session.messages.length - 1]
    if (!lastMessage) return "No messages"

    const content = lastMessage.content
    return content.length > 100 ? content.substring(0, 100) + "..." : content
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Chat History</h2>
          <p className="text-gray-600">Browse and manage your previous conversations</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={exportAllSessions} variant="outline" disabled={sessions.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={sessions.length === 0}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear All Chat History</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete all chat history? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clearAllHistory}>Clear All</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search chat history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{sessions.length}</p>
                <p className="text-sm text-gray-600">Total Chats</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {
                    sessions.filter((s) => {
                      const today = new Date()
                      const sessionDate = new Date(s.updatedAt)
                      return sessionDate.toDateString() === today.toDateString()
                    }).length
                  }
                </p>
                <p className="text-sm text-gray-600">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {sessions.reduce((total, session) => total + session.messages.length, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations ({filteredSessions.length})</CardTitle>
          <CardDescription>
            {searchTerm ? `Showing results for "${searchTerm}"` : "Your recent chat sessions"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm
                ? "No chats match your search"
                : "No chat history found. Start a conversation to see it here!"}
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{session.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{getLastMessage(session)}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {session.messages.length} messages
                          </Badge>
                          <span className="text-xs text-gray-500">{formatDate(new Date(session.updatedAt))}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedSession(session)}>
                              <Eye className="w-3 h-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle>{selectedSession?.title}</DialogTitle>
                              <DialogDescription>
                                Chat from {selectedSession && formatDate(new Date(selectedSession.createdAt))}
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="h-96">
                              <div className="space-y-4">
                                {selectedSession?.messages.map((message, index) => (
                                  <div
                                    key={index}
                                    className={`p-3 rounded-lg ${
                                      message.role === "user" ? "bg-blue-50 ml-8" : "bg-gray-50 mr-8"
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2 mb-1">
                                      <Badge variant={message.role === "user" ? "default" : "secondary"}>
                                        {message.role === "user" ? "You" : "AI"}
                                      </Badge>
                                      <span className="text-xs text-gray-500">
                                        {new Date(message.timestamp).toLocaleTimeString()}
                                      </span>
                                    </div>
                                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>

                        {onLoadChat && (
                          <Button variant="outline" size="sm" onClick={() => loadChat(session)}>
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                        )}

                        <Button variant="outline" size="sm" onClick={() => exportSession(session.id)}>
                          <Download className="w-3 h-3" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Chat</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{session.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteSession(session.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
