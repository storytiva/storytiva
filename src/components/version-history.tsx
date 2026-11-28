"use client";

import { useEffect, useState, type FormEvent } from "react";

type Version = {
  id: string;
  revision: number;
  label: string | null;
  source: "autosave" | "manual" | "restore" | "recovery";
  created_at: string;
};
type VersionDetail = Version & { title: string; content: Record<string, unknown> };

function toPlainText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const value = node as { text?: unknown; content?: unknown[]; type?: string };
  if (typeof value.text === "string") return value.text;
  if (!Array.isArray(value.content)) return "";
  const separator = ["paragraph", "heading", "blockquote", "listItem"].includes(value.type ?? "") ? "\n" : "";
  return value.content.map(toPlainText).join(separator);
}

function versionName(version: Version) {
  if (version.label) return version.label;
  if (version.source === "autosave") return "Punto automático";
  if (version.source === "restore") return "Antes de restaurar";
  if (version.source === "recovery") return "Recuperación de borrador";
  return "Hito manual";
}

export function VersionHistory({
  nodeId,
  currentContent,
  onClose,
  onRestored,
}: {
  nodeId: string;
  currentContent: Record<string, unknown>;
  onClose: () => void;
  onRestored: () => void;
}) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [selected, setSelected] = useState<VersionDetail | null>(null);
  const [label, setLabel] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState("");

  const loadVersions = async () => {
    setLoadingList(true);
    const response = await fetch(`/api/nodes/${nodeId}/versions`);
    if (!response.ok) {
      setError("No se pudo cargar el historial.");
      setLoadingList(false);
      return;
    }
    const result = await response.json() as { versions: Version[] };
    setVersions(result.versions);
    setLoadingList(false);
  };

  useEffect(() => {
    void loadVersions();
  }, [nodeId]);

  const selectVersion = async (version: Version) => {
    setLoadingDetail(true);
    setError("");
    const response = await fetch(`/api/versions/${version.id}`);
    if (!response.ok) {
      setError("No se pudo abrir esta versión.");
      setLoadingDetail(false);
      return;
    }
    const result = await response.json() as { version: VersionDetail };
    setSelected(result.version);
    setLoadingDetail(false);
  };

  const createCheckpoint = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    setError("");
    const response = await fetch(`/api/nodes/${nodeId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim() }),
    });
    setSaving(false);
    if (!response.ok) {
      setError("No se pudo guardar el hito.");
      return;
    }
    setLabel("");
    await loadVersions();
  };

  const restore = async () => {
    if (!selected || !window.confirm("Se restaurará esta versión. Guardaremos el texto actual como punto de recuperación antes de reemplazarlo.")) return;
    setRestoring(true);
    setError("");
    const response = await fetch(`/api/versions/${selected.id}/restore`, { method: "POST" });
    setRestoring(false);
    if (!response.ok) {
      setError("No se pudo restaurar la versión. Tu texto actual se conserva.");
      return;
    }
    onRestored();
  };

  return <div className="history-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="history-dialog" role="dialog" aria-modal="true" aria-labelledby="history-title">
      <header className="history-header">
        <div><p className="eyebrow">Protección del manuscrito</p><h2 id="history-title">Historial de versiones</h2></div>
        <button type="button" className="secondary-button" onClick={onClose} aria-label="Cerrar historial">Cerrar</button>
      </header>
      <form className="checkpoint-form" onSubmit={createCheckpoint}>
        <label htmlFor="checkpoint-label">Guardar un hito con nombre</label>
        <div><input id="checkpoint-label" value={label} onChange={(event) => setLabel(event.target.value)} maxLength={120} placeholder="Ej. Primer borrador del capítulo" required/><button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar hito"}</button></div>
      </form>
      {error && <p className="history-error" role="alert">{error}</p>}
      <div className="history-body">
        <nav className="version-list" aria-label="Versiones guardadas">
          {loadingList && <p>Cargando versiones…</p>}
          {!loadingList && versions.length === 0 && <p>Aún no hay versiones. Los puntos automáticos aparecerán mientras escribes; también puedes guardar un hito con nombre.</p>}
          {versions.map((version) => <button type="button" className={selected?.id === version.id ? "version-item selected" : "version-item"} key={version.id} onClick={() => void selectVersion(version)}>
            <strong>{versionName(version)}</strong><span>{new Date(version.created_at).toLocaleString()}</span><small>Revisión {version.revision}</small>
          </button>)}
        </nav>
        <section className="version-preview" aria-label="Comparación de versión">
          {loadingDetail && <p>Abriendo versión…</p>}
          {!loadingDetail && !selected && <p>Selecciona una versión para compararla con el texto actual.</p>}
          {!loadingDetail && selected && <><div className="compare-heading"><h3>{selected.title}</h3><button type="button" onClick={() => void restore()} disabled={restoring}>{restoring ? "Restaurando…" : "Restaurar esta versión"}</button></div><div className="compare-columns">
            <article><h4>{versionName(selected)} · {new Date(selected.created_at).toLocaleString()}</h4><pre>{toPlainText(selected.content) || "Esta versión no contiene texto."}</pre></article>
            <article><h4>Texto actual</h4><pre>{toPlainText(currentContent) || "El texto actual está vacío."}</pre></article>
          </div></>}
        </section>
      </div>
    </section>
  </div>;
}
