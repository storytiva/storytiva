import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { direction?: unknown };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  if (body.direction !== "up" && body.direction !== "down") {
    return NextResponse.json({ error: "invalid_direction" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("move_book_chapter", {
    target_chapter_id: chapterId,
    move_direction: body.direction,
  });
  if (error) {
    if (error.message.includes("Chapter not found")) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ error: "reorder_failed" }, { status: 400 });
  }
  return NextResponse.json({ moved: data });
}
