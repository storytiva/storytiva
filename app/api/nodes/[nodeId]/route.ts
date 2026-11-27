import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ nodeId: string }> }) {
  const { nodeId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let payload: { content?: unknown; expectedRevision?: number; recover?: boolean };
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  if (!payload.content || typeof payload.content !== "object" || !Number.isInteger(payload.expectedRevision)) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  if (payload.recover) {
    const { data, error } = await supabase.rpc("recover_book_node", { target_node_id: nodeId, expected_revision: payload.expectedRevision, recovered_content: payload.content });
    if (error) {
      if (error.message.includes("REVISION_CONFLICT")) return NextResponse.json({ error: "revision_conflict" }, { status: 409 });
      return NextResponse.json({ error: "save_failed" }, { status: 500 });
    }
    return NextResponse.json({ revision: data });
  }
  const { data: current, error: readError } = await supabase.from("book_nodes").select("book_id,revision").eq("id", nodeId).single();
  if (readError || !current) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (current.revision !== payload.expectedRevision) return NextResponse.json({ error: "revision_conflict" }, { status: 409 });
  const nextRevision = current.revision + 1;
  const { data, error } = await supabase.from("book_nodes").update({ content: payload.content, revision: nextRevision, updated_at: new Date().toISOString() }).eq("id", nodeId).eq("revision", current.revision).select("revision").maybeSingle();
  if (error || !data) return NextResponse.json({ error: "revision_conflict" }, { status: 409 });
  await supabase.from("books").update({ updated_at: new Date().toISOString() }).eq("id", current.book_id);
  return NextResponse.json({ revision: data.revision });
}
