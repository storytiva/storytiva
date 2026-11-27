import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: { nodeId?: string; cursorPosition?: number };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  if (typeof body.nodeId !== "string" || !Number.isInteger(body.cursorPosition) || (body.cursorPosition ?? -1) < 0) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const { error } = await supabase.from("book_positions").upsert({ book_id: bookId, owner_id: user.id, node_id: body.nodeId, cursor_position: body.cursorPosition, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: "save_failed" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
