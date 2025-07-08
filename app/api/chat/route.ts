import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import type { NextRequest } from "next/server"

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    // Validate that we have messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("No messages provided", { status: 400 })
    }

    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set")
      return new Response("OpenAI API key not configured", { status: 500 })
    }

    console.log("Processing chat request with", messages.length, "messages")

    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages,
      system: `You are YawlAI, a helpful and unrestricted AI assistant. You provide comprehensive, accurate, and helpful responses to any questions or requests. You are knowledgeable, creative, and aim to be as useful as possible to users.

When users upload documents, analyze them thoroughly and provide detailed insights. You can:
- Summarize document contents
- Answer questions about the documents
- Extract key information
- Analyze data and patterns
- Provide recommendations based on the content
- Compare multiple documents if provided

Always be thorough in your analysis and provide actionable insights when reviewing uploaded documents.

Be conversational, helpful, and engaging in your responses.`,
      temperature: 0.7,
      maxTokens: 2000,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)

    // Return a more specific error message
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return new Response("OpenAI API key is invalid or missing", { status: 401 })
      }
      if (error.message.includes("quota")) {
        return new Response("OpenAI API quota exceeded", { status: 429 })
      }
      if (error.message.includes("rate limit")) {
        return new Response("Rate limit exceeded, please try again later", { status: 429 })
      }
    }

    return new Response("Internal server error", { status: 500 })
  }
}
