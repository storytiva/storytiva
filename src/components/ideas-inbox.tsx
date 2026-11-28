"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Idea = { id: string; body: string; status: "inbox" | "archived"; created_at: string };

export function IdeasInbox({ bookId, onClose, onInsertIdea }: { bookId: string; onClose: () => void; onInsertIdea: (body: string) => Promise<boolean> }) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [activeTab, setActiveTab] = useState<"inbox" | "archived">("inbox");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [insertingId, setInsertingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadIdeas = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/books/${bookId}/ideas?status=${activeTab}`);
      if (!response.ok) throw new Error("load");
      const result = await response.json() as { ideas: Idea[] };
      setIdeas(result.ideas);
    } catch {
      setError("No se pudieron cargar las ideas. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [bookId, activeTab]);

  useEffect(() => { void loadIdeas(); }, [loadIdeas]);

  const requestClose = () => {
    if (draft.trim() && !window.confirm("La idea aún no está guardada. ¿Quieres cerrar y descartarla?")) return;
    onClose();
  };

  const capture = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/books/${bookId}/ideas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!response.ok) throw new Error("save");
      setDraft("");
      setActiveTab("inbox");
      if (activeTab === "inbox") await loadIdeas();
    } catch {
      setError("No se pudo guardar. Conservamos el texto en el campo para que puedas reintentar.");
    } finally {
      setSaving(false);
    }
  };

  const insertIdea = async (idea: Idea) => {
    setInsertingId(idea.id);
    setError("");
    try {
      const inserted = await onInsertIdea(idea.body);
      if (!inserted) throw new Error("insert");
      const response = await fetch(`/api/ideas/${idea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      if (!response.ok) {
        setError("La idea quedó insertada en el capítulo, pero no se pudo archivar. Puedes archivarla manualmente.");
      }
      await loadIdeas();
    } catch {
      setError("No se pudo guardar la idea en el capítulo. Sigue disponible en la bandeja.");
    } finally {
      setInsertingId(null);
    }
  };

  const changeStatus = async (idea: Idea) => {
    const status = idea.status === "inbox" ? "archived" : "inbox";
    setError("");
    try {
      const response = await fetch(`/api/ideas/${idea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("update");
      await loadIdeas();
    } catch {
      setError("No se pudo actualizar la idea.");
    }
  };

  return <div className="ideas-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) requestClose(); }}>
    <section className="ideas-dialog" role="dialog" aria-modal="true" aria-labelledby="ideas-title">
      <header className="ideas-header">
        <div><p className="eyebrow">Captura rápida · Quick capture</p><h2 id="ideas-title">Ideas sueltas</h2></div>
        <button type="button" className="secondary-button" onClick={requestClose} aria-label="Cerrar bandeja de ideas">Cerrar</button>
      </header>
      <form className="idea-capture-form" onSubmit={capture}>
        <label htmlFor="idea-body">Anota una idea y sigue escribiendo después</label>
        <textarea id="idea-body" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={5000} rows={3} placeholder="Una escena, una pregunta, una frase… no necesita título ni capítulo."/>
        <div className="capture-footer"><span>{draft.length}/5000</span><button type="submit" disabled={saving || !draft.trim()}>{saving ? "Guardando…" : "Guardar idea"}</button></div>
      </form>
      <div className="ideas-tabs" role="tablist" aria-label="Filtrar ideas">
        <button type="button" role="tab" aria-selected={activeTab === "inbox"} className={activeTab === "inbox" ? "idea-tab active" : "idea-tab"} onClick={() => setActiveTab("inbox")}>Bandeja</button>
        <button type="button" role="tab" aria-selected={activeTab === "archived"} className={activeTab === "archived" ? "idea-tab active" : "idea-tab"} onClick={() => setActiveTab("archived")}>Archivadas</button>
      </div>
      {error && <p className="ideas-error" role="alert">{error}</p>}
      <div className="idea-list" role="tabpanel">
        {loading && <p className="idea-empty">Cargando…</p>}
        {!loading && ideas.length === 0 && <p className="idea-empty">{activeTab === "inbox" ? "Aún no hay ideas. Puedes capturar una arriba sin organizarla." : "No hay ideas archivadas."}</p>}
        {!loading && ideas.map((idea) => <article className="idea-card" key={idea.id}>
          <p>{idea.body}</p>
          <footer><time dateTime={idea.created_at}>{new Date(idea.created_at).toLocaleString()}</time><div className="idea-actions">{idea.status === "inbox" && <button type="button" disabled={insertingId === idea.id} onClick={() => void insertIdea(idea)}>{insertingId === idea.id ? "Insertando…" : "Insertar en capítulo abierto"}</button>}<button type="button" className="secondary-button" disabled={insertingId === idea.id} onClick={() => void changeStatus(idea)}>{idea.status === "inbox" ? "Archivar" : "Devolver a bandeja"}</button></div></footer>
        </article>)}
      </div>
      <p className="ideas-note">Las ideas quedan privadas en este libro. Archivarlas las oculta de la bandeja, pero no las elimina.</p>
    </section>
  </div>;
}
