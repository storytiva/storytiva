import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { title?: unknown; language?: unknown };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const language = body.language === "es" ? "es" : "en";
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
  if (!title) return NextResponse.json({ error: "title_required" }, { status: 400 });

  const { data, error } = await supabase.rpc("create_book_chapter", {
    target_book_id: bookId,
    chapter_title: title,
  });
  if (error) {
    if (error.message.includes("Book not found")) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ error: "create_failed" }, { status: 400 });
  }
  return NextResponse.json({ id: data, title, language }, { status: 201 });
}
