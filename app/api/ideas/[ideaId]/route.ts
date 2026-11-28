import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ ideaId: string }> }) {
  const { ideaId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { status?: unknown };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  if (body.status !== "inbox" && body.status !== "archived") {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const { data, error } = await supabase.from("book_ideas")
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq("id", ideaId)
    .select("id,status,book_id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "update_failed" }, { status: 400 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await supabase.from("books").update({ updated_at: new Date().toISOString() }).eq("id", data.book_id);
  return NextResponse.json({ idea: data });
}
