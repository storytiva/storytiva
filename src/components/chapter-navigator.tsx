"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export type ChapterItem = { id: string; title: string; position: number };

export function ChapterNavigator({
  bookId,
  language,
  chapters,
  activeChapterId,
  onOpenChapter,
}: {
  bookId: string;
  language: string;
  chapters: ChapterItem[];
  activeChapterId: string;
  onOpenChapter: (chapterId: string) => Promise<void>;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savingNew, setSavingNew] = useState(false);
  const [error, setError] = useState("");

  const createChapter = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newTitle = title.trim();
    if (!newTitle) return;
    setSavingNew(true);
    setError("");
    try {
      const response = await fetch(`/api/books/${bookId}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, language }),
      });
      if (!response.ok) throw new Error("create");
      const result = await response.json() as { id: string };
      setTitle("");
      await onOpenChapter(result.id);
    } catch {
      setError("No se pudo crear el capítulo.");
    } finally {
      setSavingNew(false);
    }
  };

  const renameChapter = async (chapter: ChapterItem) => {
    const requested = window.prompt("Nombre del capítulo:", chapter.title);
    if (requested === null) return;
    const newTitle = requested.trim();
    if (!newTitle || newTitle === chapter.title) return;
    setBusyId(chapter.id);
    setError("");
    try {
      const response = await fetch(`/api/chapters/${chapter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!response.ok) throw new Error("rename");
      router.refresh();
    } catch {
      setError("No se pudo cambiar el nombre.");
    } finally {
      setBusyId(null);
    }
  };

  const moveChapter = async (chapter: ChapterItem, direction: "up" | "down") => {
    setBusyId(chapter.id);
    setError("");
    try {
      const response = await fetch(`/api/chapters/${chapter.id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      if (!response.ok) throw new Error("move");
      router.refresh();
    } catch {
      setError("No se pudo reordenar el capítulo.");
    } finally {
      setBusyId(null);
    }
  };

  return <aside className="chapter-sidebar" aria-label="Navegación de capítulos">
    <header><p className="eyebrow">Estructura</p><h2>Capítulos</h2></header>
    <form className="chapter-create-form" onSubmit={createChapter}>
      <label htmlFor="chapter-title">Nuevo capítulo</label>
      <input id="chapter-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} placeholder={language === "es" ? "Nombre del capítulo" : "Chapter title"} required/>
      <button type="submit" disabled={savingNew || !title.trim()}>{savingNew ? "Creando…" : "Agregar capítulo"}</button>
    </form>
    {error && <p className="chapter-error" role="alert">{error}</p>}
    <ol className="chapter-list">
      {chapters.map((chapter, index) => <li className={chapter.id === activeChapterId ? "chapter-entry active" : "chapter-entry"} key={chapter.id}>
        <button type="button" className="chapter-open" aria-current={chapter.id === activeChapterId ? "page" : undefined} onClick={() => void onOpenChapter(chapter.id)}>{chapter.title}</button>
        <div className="chapter-controls">
          <button type="button" aria-label={`Mover ${chapter.title} arriba`} title="Mover arriba" disabled={index === 0 || busyId === chapter.id} onClick={() => void moveChapter(chapter, "up")}>↑</button>
          <button type="button" aria-label={`Mover ${chapter.title} abajo`} title="Mover abajo" disabled={index === chapters.length - 1 || busyId === chapter.id} onClick={() => void moveChapter(chapter, "down")}>↓</button>
          <button type="button" aria-label={`Renombrar ${chapter.title}`} title="Cambiar nombre" disabled={busyId === chapter.id} onClick={() => void renameChapter(chapter)}>✎</button>
        </div>
      </li>)}
    </ol>
    {!chapters.length && <p className="chapter-empty">Crea el primer capítulo para empezar.</p>}
  </aside>;
}
