const DB_NAME = "storytiva-drafts";
const STORE = "nodes";

type Draft = { nodeId: string; revision: number; content: unknown; updatedAt: number };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "nodeId" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function readDraft(nodeId: string): Promise<Draft | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).get(nodeId);
    request.onsuccess = () => resolve(request.result as Draft | undefined);
    request.onerror = () => reject(request.error);
  });
}
export async function writeDraft(draft: Draft): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readwrite").objectStore(STORE).put(draft);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
export async function removeDraft(nodeId: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readwrite").objectStore(STORE).delete(nodeId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
