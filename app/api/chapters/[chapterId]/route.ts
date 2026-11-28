import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { title?: unknown };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
  if (!title) return NextResponse.json({ error: "invalid_title" }, { status: 400 });

  const { data, error } = await supabase.from("book_nodes")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", chapterId)
    .eq("kind", "chapter")
    .select("id,title,book_id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "rename_failed" }, { status: 400 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await supabase.from("books").update({ updated_at: new Date().toISOString() }).eq("id", data.book_id);
  return NextResponse.json({ id: data.id, title: data.title });
}
