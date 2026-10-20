import type { Subject } from "./storage";

const DB_NAME = "mathtutor_favorites";
const DB_VERSION = 1;
const STORE_NAME = "favorites";

export interface FavoriteEntry {
  id: string;
  subject: Subject;
  questionId: string;
  savedAt: string;
}

function makeId(subject: Subject, questionId: string): string {
  return `${subject}:${questionId}`;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("subject", "subject", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function isFavorite(subject: Subject, questionId: string): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(makeId(subject, questionId));
    req.onsuccess = () => resolve(!!req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function toggleFavorite(subject: Subject, questionId: string): Promise<boolean> {
  const db = await openDB();
  const id = makeId(subject, questionId);
  const exists = await isFavorite(subject, questionId);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    if (exists) {
      store.delete(id);
      tx.oncomplete = () => resolve(false);
    } else {
      store.put({
        id,
        subject,
        questionId,
        savedAt: new Date().toISOString(),
      } satisfies FavoriteEntry);
      tx.oncomplete = () => resolve(true);
    }
    tx.onerror = () => reject(tx.error);
  });
}

export async function getFavoriteCount(subject: Subject): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("subject");
    const req = index.count(subject);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllFavorites(): Promise<FavoriteEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as FavoriteEntry[]);
    req.onerror = () => reject(req.error);
  });
}

export async function importFavorites(entries: FavoriteEntry[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    for (const e of entries) {
      store.put(e);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
