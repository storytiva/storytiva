"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createBook(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim().slice(0, 200) || "Untitled book";
  const language = String(formData.get("language") ?? "en") === "es" ? "es" : "en";
  const supabase = await createClient();
  const { data: bookId, error } = await supabase.rpc("create_book_with_first_chapter", { book_title: title, book_language: language });
  if (error || !bookId) throw new Error("Could not create book.");
  redirect(`/books/${bookId}`);
}
