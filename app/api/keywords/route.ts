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
      console.error("Database error:", error)
      // Return empty array if table doesn't exist
      return NextResponse.json([])
    }

    return NextResponse.json(keywords || [])
  } catch (error) {
    console.error("Error fetching keywords:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  const supabase = createServerClient()

  try {
    const { keyword, target_url, active = true } = await request.json()

    const { data, error } = await supabase.from("keywords").insert([{ keyword, target_url, active }]).select().single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating keyword:", error)
    return NextResponse.json({ error: "Failed to create keyword" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const supabase = createServerClient()

  try {
    const { id, keyword, target_url, active } = await request.json()

    const { data, error } = await supabase
      .from("keywords")
      .update({ keyword, target_url, active, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating keyword:", error)
    return NextResponse.json({ error: "Failed to update keyword" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const supabase = createServerClient()

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("keywords").delete().eq("id", Number.parseInt(id))

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting keyword:", error)
    return NextResponse.json({ error: "Failed to delete keyword" }, { status: 500 })
  }
}
