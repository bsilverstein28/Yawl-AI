import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    const { keyword, target_url, active } = await request.json()
    const id = params.id

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const updateData: any = { updated_at: new Date().toISOString() }

    if (keyword !== undefined) updateData.keyword = keyword.trim()
    if (target_url !== undefined) updateData.target_url = target_url.trim()
    if (active !== undefined) updateData.active = active

    const { data, error } = await supabase
      .from("keywords")
      .update(updateData)
      .eq("id", Number.parseInt(id))
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to update keyword" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating keyword:", error)
    return NextResponse.json({ error: "Failed to update keyword" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  try {
    const id = params.id

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("keywords").delete().eq("id", Number.parseInt(id))

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to delete keyword" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting keyword:", error)
    return NextResponse.json({ error: "Failed to delete keyword" }, { status: 500 })
  }
}
