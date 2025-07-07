import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createServerClient()

  try {
    // Test each table exists and can be queried
    const tests = []

    // Test keywords table
    try {
      const { data: keywords, error: keywordsError } = await supabase
        .from("keywords")
        .select("count", { count: "exact" })
        .limit(1)

      tests.push({
        table: "keywords",
        status: keywordsError ? "error" : "success",
        error: keywordsError?.message,
        count: keywords?.length || 0,
      })
    } catch (err) {
      tests.push({
        table: "keywords",
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      })
    }

    // Test analytics_summary table
    try {
      const { data: analytics, error: analyticsError } = await supabase
        .from("analytics_summary")
        .select("count", { count: "exact" })
        .limit(1)

      tests.push({
        table: "analytics_summary",
        status: analyticsError ? "error" : "success",
        error: analyticsError?.message,
        count: analytics?.length || 0,
      })
    } catch (err) {
      tests.push({
        table: "analytics_summary",
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      })
    }

    // Test searches table
    try {
      const { data: searches, error: searchesError } = await supabase
        .from("searches")
        .select("count", { count: "exact" })
        .limit(1)

      tests.push({
        table: "searches",
        status: searchesError ? "error" : "success",
        error: searchesError?.message,
        count: searches?.length || 0,
      })
    } catch (err) {
      tests.push({
        table: "searches",
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      })
    }

    // Test token_usage table
    try {
      const { data: tokens, error: tokensError } = await supabase
        .from("token_usage")
        .select("count", { count: "exact" })
        .limit(1)

      tests.push({
        table: "token_usage",
        status: tokensError ? "error" : "success",
        error: tokensError?.message,
        count: tokens?.length || 0,
      })
    } catch (err) {
      tests.push({
        table: "token_usage",
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      })
    }

    // Test database functions
    try {
      const { error: functionError } = await supabase.rpc("increment_searches", {
        p_date: new Date().toISOString().split("T")[0],
      })

      tests.push({
        table: "increment_searches_function",
        status: functionError ? "error" : "success",
        error: functionError?.message,
      })
    } catch (err) {
      tests.push({
        table: "increment_searches_function",
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      })
    }

    const successCount = tests.filter((t) => t.status === "success").length
    const totalTests = tests.length

    return NextResponse.json({
      success: successCount === totalTests,
      message: `Database test completed: ${successCount}/${totalTests} tests passed`,
      tests,
      summary: {
        total_tests: totalTests,
        passed: successCount,
        failed: totalTests - successCount,
      },
    })
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Database test failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
