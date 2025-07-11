import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createServerClient()

  try {
    const { data: keywords, error } = await supabase
      .from("keywords")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching keywords:", error)
      return NextResponse.json({ error: "Failed to fetch keywords" }, { status: 500 })
    }

    return NextResponse.json({ keywords: keywords || [] })
  } catch (error) {
    console.error("Error in keywords GET route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { keyword, target_url, active = true } = body

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

    // Check for duplicate keywords
    const { data: existingKeyword } = await supabase
      .from("keywords")
      .select("id")
      .eq("keyword", keyword.trim())
      .single()

    if (existingKeyword) {
      return NextResponse.json({ error: "Keyword already exists" }, { status: 409 })
    }

    // Insert new keyword
    const { data, error } = await supabase
      .from("keywords")
      .insert([
        {
          keyword: keyword.trim(),
          target_url: target_url.trim(),
          active: Boolean(active),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating keyword:", error)
      return NextResponse.json({ error: "Failed to create keyword" }, { status: 500 })
    }

    return NextResponse.json({ keyword: data }, { status: 201 })
  } catch (error) {
    console.error("Error in keywords POST route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { id, keyword, target_url, active } = body

    // Validate required fields
    if (!id || !keyword || !target_url) {
      return NextResponse.json({ error: "ID, keyword, and target URL are required" }, { status: 400 })
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
      .neq("id", id)
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
      .eq("id", id)
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
    console.error("Error in keywords PUT route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const supabase = createServerClient()

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Keyword ID is required" }, { status: 400 })
    }

    // Delete keyword
    const { error } = await supabase.from("keywords").delete().eq("id", id)

    if (error) {
      console.error("Error deleting keyword:", error)
      return NextResponse.json({ error: "Failed to delete keyword" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in keywords DELETE route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
