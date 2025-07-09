export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

const STORAGE_KEY = "yawlai_chat_history"
const MAX_SESSIONS = 100 // Limit to prevent storage bloat

export class ChatStorage {
  static getSessions(): ChatSession[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return []

      const sessions = JSON.parse(stored)
      return sessions.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }))
    } catch (error) {
      console.error("Error loading chat sessions:", error)
      return []
    }
  }

  static saveSession(session: ChatSession): void {
    if (typeof window === "undefined") return

    try {
      const sessions = this.getSessions()
      const existingIndex = sessions.findIndex((s) => s.id === session.id)

      if (existingIndex >= 0) {
        sessions[existingIndex] = session
      } else {
        sessions.unshift(session)

        // Limit the number of stored sessions
        if (sessions.length > MAX_SESSIONS) {
          sessions.splice(MAX_SESSIONS)
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
    } catch (error) {
      console.error("Error saving chat session:", error)
    }
  }

  static deleteSession(sessionId: string): void {
    if (typeof window === "undefined") return

    try {
      const sessions = this.getSessions()
      const filtered = sessions.filter((s) => s.id !== sessionId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    } catch (error) {
      console.error("Error deleting chat session:", error)
    }
  }

  static clearAllSessions(): void {
    if (typeof window === "undefined") return

    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error("Error clearing chat sessions:", error)
    }
  }

  static exportSession(sessionId: string): string | null {
    const sessions = this.getSessions()
    const session = sessions.find((s) => s.id === sessionId)

    if (!session) return null

    return JSON.stringify(session, null, 2)
  }

  static exportAllSessions(): string {
    const sessions = this.getSessions()
    return JSON.stringify(sessions, null, 2)
  }

  static generateTitle(firstMessage: string): string {
    // Generate a title from the first user message
    const words = firstMessage.trim().split(" ")
    if (words.length <= 6) {
      return firstMessage
    }
    return words.slice(0, 6).join(" ") + "..."
  }

  static createSession(messages: ChatMessage[]): ChatSession {
    const now = new Date()
    const firstUserMessage = messages.find((m) => m.role === "user")
    const title = firstUserMessage ? this.generateTitle(firstUserMessage.content) : "New Chat"

    return {
      id: crypto.randomUUID(),
      title,
      messages,
      createdAt: now,
      updatedAt: now,
    }
  }
}
