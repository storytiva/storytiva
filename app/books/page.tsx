import Link from "next/link";
import { redirect } from "next/navigation";
import { createBook } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../logout/actions";

export default async function BooksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: books } = await supabase.from("books").select("id,title,language,updated_at").order("updated_at", { ascending: false });
  return <main className="workspace-shell"><header className="topbar"><Link className="wordmark" href="/">Storytiva</Link><form action={signOut}><button className="secondary-button">Cerrar sesión</button></form></header><section className="content-column"><p className="eyebrow">Tu biblioteca · Your library</p><h1>Tus libros</h1><form action={createBook} className="create-form"><label htmlFor="title">Nuevo libro</label><div className="form-row"><input id="title" name="title" placeholder="Título del libro" maxLength={200}/><select name="language" aria-label="Idioma"><option value="es">Español</option><option value="en">English</option></select><button type="submit">Crear libro</button></div></form><div className="book-list">{(books ?? []).map((book) => <Link className="book-card" key={book.id} href={`/books/${book.id}`}><strong>{book.title}</strong><span>{book.language === "es" ? "Español" : "English"} · {new Date(book.updated_at).toLocaleDateString()}</span></Link>)}{!books?.length && <p className="empty-state">Tu próximo libro puede empezar con una sola página.</p>}</div></section></main>;
}
