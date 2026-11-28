import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const requestedStatus = request.nextUrl.searchParams.get("status");
  const status = requestedStatus === "archived" || requestedStatus === "all" ? requestedStatus : "inbox";
  let query = supabase.from("book_ideas").select("id,body,status,created_at,updated_at").eq("book_id", bookId);
  if (status !== "all") query = query.eq("status", status);
  const { data, error } = await query.order("created_at", { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: "load_failed" }, { status: 500 });
  return NextResponse.json({ ideas: data ?? [] });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { body?: unknown };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const idea = typeof body.body === "string" ? body.body.trim() : "";
  if (!idea || idea.length > 5000) return NextResponse.json({ error: "invalid_idea" }, { status: 400 });

  const { data, error } = await supabase.from("book_ideas")
    .insert({ book_id: bookId, owner_id: user.id, body: idea })
    .select("id,body,status,created_at,updated_at")
    .single();
  if (error || !data) return NextResponse.json({ error: "save_failed" }, { status: 400 });
  return NextResponse.json({ idea: data }, { status: 201 });
}
