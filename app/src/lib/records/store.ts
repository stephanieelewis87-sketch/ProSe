/**
 * Medical records live only in this browser (IndexedDB). Nothing is uploaded to a server.
 */

export type RecordKind = "chart" | "imaging" | "lab" | "bill" | "letter" | "photo" | "other";

export interface MedicalRecord {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  provider: string;
  /** Date of service, "YYYY-MM-DD", or "" if unknown. */
  date: string;
  kind: RecordKind;
  notes: string;
  addedAt: string;
}

interface Stored extends MedicalRecord {
  blob: Blob;
}

const DB = "prose-records";
const STORE = "records";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function listRecords(): Promise<MedicalRecord[]> {
  const all = await tx<Stored[]>("readonly", (s) => s.getAll() as IDBRequest<Stored[]>);
  return all.map((r) => {
    const meta: Partial<Stored> = { ...r };
    delete meta.blob;
    return meta as MedicalRecord;
  });
}

export async function addFiles(files: File[]): Promise<void> {
  for (const f of files) {
    const rec: Stored = {
      id: crypto.randomUUID(), fileName: f.name, mimeType: f.type || "application/octet-stream", size: f.size,
      provider: "", date: "", kind: f.type.startsWith("image/") ? "photo" : "chart", notes: "",
      addedAt: new Date().toISOString(), blob: f,
    };
    await tx("readwrite", (s) => s.put(rec));
  }
}

export async function updateRecord(meta: MedicalRecord): Promise<void> {
  const cur = await tx<Stored | undefined>("readonly", (s) => s.get(meta.id) as IDBRequest<Stored | undefined>);
  if (cur) await tx("readwrite", (s) => s.put({ ...cur, ...meta }));
}

export async function deleteRecord(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
}

export async function getBlob(id: string): Promise<Blob | undefined> {
  const cur = await tx<Stored | undefined>("readonly", (s) => s.get(id) as IDBRequest<Stored | undefined>);
  return cur?.blob;
}

/** Records in date order; undated ones last. */
export function timeline(records: MedicalRecord[]): MedicalRecord[] {
  return [...records].sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999") || a.fileName.localeCompare(b.fileName));
}

export function recordTitle(r: MedicalRecord): string {
  return [r.provider || "Unknown provider", r.kind, r.date].filter(Boolean).join(", ") + ` (${r.fileName})`;
}
