import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ nodeId: string }> }) {
  const { nodeId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let payload: { content?: unknown; expectedRevision?: number; recover?: boolean };
  try { payload = await request.json(); }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

  if (!payload.content || typeof payload.content !== "object" || !Number.isInteger(payload.expectedRevision)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (payload.recover) {
    const { data, error } = await supabase.rpc("recover_book_node", {
      target_node_id: nodeId,
      expected_revision: payload.expectedRevision,
      recovered_content: payload.content,
    });
    if (error) {
      if (error.message.includes("REVISION_CONFLICT")) return NextResponse.json({ error: "revision_conflict" }, { status: 409 });
      return NextResponse.json({ error: "save_failed" }, { status: 500 });
    }
    return NextResponse.json({ revision: data });
  }

  const { data, error } = await supabase.rpc("save_book_node", {
    target_node_id: nodeId,
    expected_revision: payload.expectedRevision,
    new_content: payload.content,
  });
  if (error) {
    if (error.message.includes("REVISION_CONFLICT")) return NextResponse.json({ error: "revision_conflict" }, { status: 409 });
    if (error.message.includes("Node not found")) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
  const result = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ revision: result.revision, snapshotCreated: result.snapshot_created });
}
