"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { readDraft, removeDraft, writeDraft } from "@/lib/draft-cache";
import { VersionHistory } from "@/components/version-history";

type NodeData = { id: string; title: string; content: Record<string, unknown>; revision: number };
type Props = { bookId: string; bookTitle: string; node: NodeData; initialCursor: number };

export function BookEditor({ bookId, bookTitle, node, initialCursor }: Props) {
  const [revision, setRevision] = useState(node.revision);
  const [status, setStatus] = useState("Guardado");
  const [conflict, setConflict] = useState<Record<string, unknown> | null>(null);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const savedRevision = useRef(node.revision);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editor = useEditor({
    extensions: [StarterKit],
    content: node.content,
    immediatelyRender: false,
    editorProps: { attributes: { class: "manuscript-editor", "aria-label": "Manuscript editor" } },
    onUpdate: ({ editor: current }) => {
      const content = current.getJSON();
      setStatus("Guardando…");
      void writeDraft({ nodeId: node.id, revision: savedRevision.current, content, updatedAt: Date.now() });
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => { void save(content); }, 900);
    },
    onSelectionUpdate: ({ editor: current }) => {
      const pos = current.state.selection.from;
      void fetch(`/api/books/${bookId}/position`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nodeId: node.id, cursorPosition: pos }) });
    },
  });

  const save = useCallback(async (content: Record<string, unknown>, recover = false): Promise<boolean> => {
    setStatus("Guardando…");
    try {
      const response = await fetch(`/api/nodes/${node.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, expectedRevision: savedRevision.current, recover }) });
      if (response.status === 409) { setConflict(content); setStatus("Hay otra versión guardada"); return false; }
      if (!response.ok) { setStatus("No se pudo guardar. El borrador sigue en este dispositivo."); return false; }
      const result = await response.json() as { revision: number };
      savedRevision.current = result.revision;
      setRevision(result.revision);
      setStatus("Guardado");
      setRecoveryReady(false);
      setConflict(null);
      await removeDraft(node.id);
      return true;
    } catch { setStatus("Sin conexión. El borrador sigue en este dispositivo."); return false; }
  }, [node.id]);

  useEffect(() => {
    let active = true;
    void readDraft(node.id).then((draft) => {
      if (active && draft && draft.updatedAt > Date.now() - 30 * 24 * 60 * 60 * 1000) {
        setConflict(draft.content as Record<string, unknown>);
        setRecoveryReady(true);
        setStatus("Hay un borrador local pendiente");
      }
    }).catch(() => undefined);
    return () => { active = false; if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [node.id]);

  const recover = async () => {
    if (conflict && await save(conflict, true)) window.location.reload();
  };
  const copyDraft = async () => {
    if (!conflict) return;
    await navigator.clipboard.writeText(JSON.stringify(conflict, null, 2));
    setStatus("Borrador copiado como JSON");
  };

  return <section className="editor-layout"><div className="editor-heading"><div><p className="eyebrow">{bookTitle}</p><h1>{node.title}</h1></div><span className="save-status" role="status">{status}</span></div>{conflict && <aside className="conflict-panel"><strong>{recoveryReady ? "Se encontró un borrador en este dispositivo." : "Este capítulo cambió en otra sesión."}</strong><p>Puedes guardar el borrador como nueva revisión; la versión de la nube quedará registrada para recuperación.</p><div className="button-row"><button type="button" onClick={recover}>Recuperar mi borrador</button><button className="secondary-button" type="button" onClick={copyDraft}>Copiar borrador</button><button className="secondary-button" type="button" onClick={() => { setConflict(null); setRecoveryReady(false); setStatus("La versión de la nube se conserva"); }}>Usar versión guardada</button></div></aside>}<div className="editor-toolbar"><span>Revisión {revision}</span><span>·</span><span>El contenido se guarda automáticamente</span><button type="button" className="secondary-button history-button" onClick={() => setHistoryOpen(true)}>Historial</button></div><div className="editor-paper"><EditorContent editor={editor}/></div>{historyOpen && <VersionHistory nodeId={node.id} currentContent={node.content} onClose={() => setHistoryOpen(false)} onRestored={() => window.location.reload()}/>}</section>;
}
