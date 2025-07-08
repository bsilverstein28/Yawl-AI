import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("=== Testing OpenAI Configuration ===")

    // Check environment variables
    const apiKey = process.env.OPENAI_API_KEY

    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      apiKeyPresent: !!apiKey,
      apiKeyFormat: apiKey ? (apiKey.startsWith("sk-") ? "valid" : "invalid") : "missing",
      apiKeyLength: apiKey ? apiKey.length : 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 7) + "..." : "none",
    }

    console.log("Diagnostics:", diagnostics)

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "OPENAI_API_KEY not found",
          diagnostics,
        },
        { status: 500 },
      )
    }

    if (!apiKey.startsWith("sk-")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid API key format",
          diagnostics,
        },
        { status: 500 },
      )
    }

    // Test actual API call
    console.log("Testing OpenAI API call...")

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: "Say 'Hello from YawlAI!' and nothing else.",
      maxTokens: 10,
    })

    console.log("OpenAI response:", text)

    return NextResponse.json({
      success: true,
      message: "OpenAI API is working correctly",
      response: text,
      diagnostics,
    })
  } catch (error: any) {
    console.error("OpenAI test error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
        errorType: error.constructor.name,
        diagnostics: {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          apiKeyPresent: !!process.env.OPENAI_API_KEY,
          apiKeyFormat: process.env.OPENAI_API_KEY
            ? process.env.OPENAI_API_KEY.startsWith("sk-")
              ? "valid"
              : "invalid"
            : "missing",
        },
      },
      { status: 500 },
    )
  }
}
