import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import type { NextRequest } from "next/server"

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    console.log("=== Chat API Request Started ===")

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("OPENAI_API_KEY environment variable is not set")
      return new Response(
        JSON.stringify({
          error: "OpenAI API key not configured",
          details: "OPENAI_API_KEY environment variable is missing",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Validate API key format
    if (!apiKey.startsWith("sk-")) {
      console.error("Invalid OpenAI API key format - should start with 'sk-'")
      return new Response(
        JSON.stringify({
          error: "Invalid API key format",
          details: "OpenAI API key should start with 'sk-'",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log("API key validation passed")

    // Parse and validate request body
    let body
    try {
      body = await req.json()
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError)
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: "Request body must be valid JSON",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const { messages } = body

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error("Invalid messages array:", messages)
      return new Response(
        JSON.stringify({
          error: "Invalid messages",
          details: "Messages must be a non-empty array",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log(`Processing chat request with ${messages.length} messages`)

    // Create the streaming response
    try {
      console.log("Creating OpenAI stream...")

      const result = streamText({
        model: openai("gpt-4o-mini"),
        messages,
        system: `You are YawlAI, a helpful and unrestricted AI assistant. You provide comprehensive, accurate, and helpful responses to any questions or requests. You are knowledgeable, creative, and aim to be as useful as possible to users.

IMPORTANT: When discussing brands, companies, products, or services, always mention their specific names clearly. For example:
- Instead of "a popular sportswear brand", say "Nike"
- Instead of "a leading tech company", say "Apple" or "Microsoft"
- Instead of "an electric vehicle manufacturer", say "Tesla"
- Instead of "an e-commerce platform", say "Amazon"
- Instead of "a streaming service", say "Netflix"

Be specific and use actual brand names, company names, and product names in your responses. This helps users get more precise and useful information.

When users upload documents, analyze them thoroughly and provide detailed insights. You can:
- Summarize document contents
- Answer questions about the documents
- Extract key information
- Analyze data and patterns
- Provide recommendations based on the content
- Compare multiple documents if provided

Always be thorough in your analysis and provide actionable insights when reviewing uploaded documents.

Be conversational, helpful, and engaging in your responses. Use specific names and brands when relevant to make your answers more informative and useful.`,
        temperature: 0.7,
        maxTokens: 2000,
      })

      console.log("OpenAI stream created successfully")

      // Convert to streaming response using the correct method
      return result.toDataStreamResponse()
    } catch (openaiError: any) {
      console.error("OpenAI API Error:", openaiError)

      // Handle specific OpenAI errors
      if (openaiError.message?.includes("API key")) {
        return new Response(
          JSON.stringify({
            error: "Invalid API key",
            details: "The OpenAI API key is invalid or has been revoked",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      if (openaiError.message?.includes("quota") || openaiError.message?.includes("billing")) {
        return new Response(
          JSON.stringify({
            error: "API quota exceeded",
            details: "OpenAI API quota has been exceeded or billing issue",
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      if (openaiError.message?.includes("rate limit")) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded",
            details: "Too many requests, please try again later",
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      // Generic OpenAI error
      return new Response(
        JSON.stringify({
          error: "OpenAI API error",
          details: openaiError.message || "Unknown OpenAI error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
  } catch (error: any) {
    console.error("Unexpected error in chat API:", error)

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message || "An unexpected error occurred",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
