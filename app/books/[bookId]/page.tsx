import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookEditor } from "@/components/book-editor";
import { signOut } from "../../logout/actions";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookId: string }>;
  searchParams: Promise<{ node?: string }>;
}) {
  const [{ bookId }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: book } = await supabase.from("books")
    .select("id,title,language")
    .eq("id", bookId)
    .single();
  if (!book) notFound();

  const { data: nodes } = await supabase.from("book_nodes")
    .select("id,title,kind,position,content,revision")
    .eq("book_id", bookId)
    .eq("kind", "chapter")
    .order("position");
  const chapters = nodes ?? [];

  const [{ data: savedPosition }, { data: chapterPositions }] = await Promise.all([
    supabase.from("book_positions").select("node_id,cursor_position").eq("book_id", bookId).maybeSingle(),
    supabase.from("book_node_positions").select("node_id,cursor_position").eq("book_id", bookId),
  ]);

  const node = chapters.find((chapter) => chapter.id === query.node)
    ?? chapters.find((chapter) => chapter.id === savedPosition?.node_id)
    ?? chapters[0];
  const positionMap = Object.fromEntries((chapterPositions ?? []).map((item) => [item.node_id, item.cursor_position]));
  const initialCursor = node
    ? positionMap[node.id] ?? (savedPosition?.node_id === node.id ? savedPosition.cursor_position : 0)
    : 0;

  return <main className="workspace-shell">
    <header className="topbar">
      <div><Link className="wordmark" href="/books">Storytiva</Link><span className="breadcrumb"> / {book.title}</span></div>
      <form action={signOut}><button className="secondary-button">Cerrar sesión</button></form>
    </header>
    {node
      ? <BookEditor
          key={node.id}
          bookId={book.id}
          bookTitle={book.title}
          language={book.language}
          node={node}
          chapters={chapters.map(({ id, title, position }) => ({ id, title, position }))}
          chapterPositions={positionMap}
          initialCursor={initialCursor}
        />
      : <p className="chapter-empty">Este libro aún no tiene capítulos.</p>}
  </main>;
}
