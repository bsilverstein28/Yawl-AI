import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    const { data: keyword, error } = await supabase.from("keywords").select("*").eq("id", params.id).single()

    if (error) {
      console.error("Error fetching keyword:", error)
      return NextResponse.json({ error: "Keyword not found" }, { status: 404 })
    }

    return NextResponse.json({ keyword })
  } catch (error) {
    console.error("Error in keyword GET route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { keyword, target_url, active } = body

    // Validate required fields
    if (!keyword || !target_url) {
      return NextResponse.json({ error: "Keyword and target URL are required" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(target_url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // Check for duplicate keywords (excluding current one)
    const { data: existingKeyword } = await supabase
      .from("keywords")
      .select("id")
      .eq("keyword", keyword.trim())
      .neq("id", params.id)
      .single()

    if (existingKeyword) {
      return NextResponse.json({ error: "Keyword already exists" }, { status: 409 })
    }

    // Update keyword
    const { data, error } = await supabase
      .from("keywords")
      .update({
        keyword: keyword.trim(),
        target_url: target_url.trim(),
        active: Boolean(active),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating keyword:", error)
      return NextResponse.json({ error: "Failed to update keyword" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Keyword not found" }, { status: 404 })
    }

    return NextResponse.json({ keyword: data })
  } catch (error) {
    console.error("Error in keyword PUT route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    // Delete keyword
    const { error } = await supabase.from("keywords").delete().eq("id", params.id)

    if (error) {
      console.error("Error deleting keyword:", error)
      return NextResponse.json({ error: "Failed to delete keyword" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in keyword DELETE route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
