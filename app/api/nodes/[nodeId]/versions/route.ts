import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ nodeId: string }> }) {
  const { nodeId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("book_versions")
    .select("id,revision,label,source,created_at")
    .eq("node_id", nodeId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: "load_failed" }, { status: 500 });
  return NextResponse.json({ versions: data ?? [] });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ nodeId: string }> }) {
  const { nodeId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { label?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const label = typeof body.label === "string" ? body.label.trim().slice(0, 120) : "";
  if (!label) return NextResponse.json({ error: "label_required" }, { status: 400 });

  const { data, error } = await supabase.rpc("create_book_node_version", {
    target_node_id: nodeId,
    version_label: label,
  });
  if (error) return NextResponse.json({ error: "save_failed" }, { status: 400 });
  return NextResponse.json({ id: data }, { status: 201 });
}
