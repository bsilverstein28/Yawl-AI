"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import ChatHistory from "@/components/chat-history"
import { useRouter } from "next/navigation"
import type { ChatSession } from "@/lib/chat-storage"

export default function ChatHistoryPage() {
  const router = useRouter()

  const handleLoadChat = (session: ChatSession) => {
    // Store the session to load in sessionStorage for the main chat page
    sessionStorage.setItem("loadChatSession", JSON.stringify(session))
    // Navigate back to main chat
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" className="mb-4 bg-transparent">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Chat
            </Button>
          </Link>
        </div>

        {/* Chat History Component */}
        <ChatHistory onLoadChat={handleLoadChat} />
      </div>
    </div>
  )
}
