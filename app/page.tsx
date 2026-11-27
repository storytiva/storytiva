import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  if (!isSupabaseConfigured()) {
    return <main className="page-shell"><section className="welcome-card"><p className="wordmark">Storytiva</p><p className="eyebrow">Tu taller de escritura · Your writing studio</p><h1>Vuelve a escribir sin volver a organizarlo todo.</h1><p className="intro">Configura Supabase para empezar a crear libros. See the README for setup instructions.</p></section></main>;
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  redirect(user ? "/books" : "/login");
}
