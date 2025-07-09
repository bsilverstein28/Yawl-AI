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
  messageCount: number
}

const STORAGE_KEY = "yawlai_chat_history"
const MAX_SESSIONS = 50 // Limit to prevent storage bloat

// Generate a title from the first user message
function generateChatTitle(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find((m) => m.role === "user")
  if (!firstUserMessage) return "New Chat"

  const content = firstUserMessage.content.trim()
  if (content.length <= 50) return content

  // Try to find a natural break point
  const words = content.split(" ")
  let title = ""
  for (const word of words) {
    if ((title + " " + word).length > 50) break
    title += (title ? " " : "") + word
  }

  return title || content.substring(0, 50) + "..."
}

// Get all chat sessions from localStorage
export function getChatSessions(): ChatSession[] {
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

// Save a chat session
export function saveChatSession(messages: ChatMessage[], sessionId?: string): string {
  try {
    if (messages.length === 0) return sessionId || ""

    const sessions = getChatSessions()
    const now = new Date()

    const existingIndex = sessionId ? sessions.findIndex((s) => s.id === sessionId) : -1

    const chatSession: ChatSession = {
      id: sessionId || generateId(),
      title: generateChatTitle(messages),
      messages: messages,
      createdAt: existingIndex >= 0 ? sessions[existingIndex].createdAt : now,
      updatedAt: now,
      messageCount: messages.length,
    }

    if (existingIndex >= 0) {
      sessions[existingIndex] = chatSession
    } else {
      sessions.unshift(chatSession) // Add to beginning
    }

    // Limit the number of stored sessions
    const limitedSessions = sessions.slice(0, MAX_SESSIONS)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedSessions))
    return chatSession.id
  } catch (error) {
    console.error("Error saving chat session:", error)
    return sessionId || ""
  }
}

// Delete a chat session
export function deleteChatSession(sessionId: string): void {
  try {
    const sessions = getChatSessions()
    const filteredSessions = sessions.filter((s) => s.id !== sessionId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredSessions))
  } catch (error) {
    console.error("Error deleting chat session:", error)
  }
}

// Get a specific chat session
export function getChatSession(sessionId: string): ChatSession | null {
  const sessions = getChatSessions()
  return sessions.find((s) => s.id === sessionId) || null
}

// Clear all chat history
export function clearAllChatHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error("Error clearing chat history:", error)
  }
}

// Generate a unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Export chat session as JSON
export function exportChatSession(sessionId: string): string {
  const session = getChatSession(sessionId)
  if (!session) throw new Error("Session not found")

  return JSON.stringify(session, null, 2)
}

// Export all chat history
export function exportAllChatHistory(): string {
  const sessions = getChatSessions()
  return JSON.stringify(sessions, null, 2)
}
