import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookEditor } from "@/components/book-editor";
import { signOut } from "../../logout/actions";

export default async function BookPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: book } = await supabase.from("books").select("id,title,language").eq("id", bookId).single();
  if (!book) notFound();
  const { data: nodes } = await supabase.from("book_nodes").select("id,title,kind,position,content,revision").eq("book_id", bookId).order("position");
  const { data: savedPosition } = await supabase.from("book_positions").select("node_id,cursor_position").eq("book_id", bookId).maybeSingle();
  const node = nodes?.find((item) => item.id === savedPosition?.node_id) ?? nodes?.[0];
  return <main className="workspace-shell"><header className="topbar"><div><Link className="wordmark" href="/books">Storytiva</Link><span className="breadcrumb"> / {book.title}</span></div><form action={signOut}><button className="secondary-button">Cerrar sesión</button></form></header>{node ? <BookEditor bookId={book.id} bookTitle={book.title} node={node} initialCursor={savedPosition?.cursor_position ?? 0}/> : <p>No chapter found.</p>}</main>;
}
