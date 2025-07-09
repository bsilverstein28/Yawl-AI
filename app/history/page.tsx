"use client"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import ChatHistory from "@/components/chat-history"
import type { ChatSession } from "@/lib/chat-storage"
import { useToast } from "@/hooks/use-toast"

export default function HistoryPage() {
  const router = useRouter()
  const { toast } = useToast()

  const handleLoadChat = (session: ChatSession) => {
    // Store the session to be loaded in sessionStorage for the main page
    sessionStorage.setItem("loadChatSession", JSON.stringify(session))

    // Navigate back to main chat page
    router.push("/")

    toast({
      title: "Chat Loaded",
      description: `Loading chat: ${session.title}`,
    })
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
          <h1 className="text-3xl font-bold">Chat History</h1>
          <p className="text-gray-600 dark:text-gray-400">Browse and manage your previous conversations</p>
        </div>

        <ChatHistory onLoadChat={handleLoadChat} />
      </div>
    </div>
  )
}
