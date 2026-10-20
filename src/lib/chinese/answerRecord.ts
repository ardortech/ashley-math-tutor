const DB_NAME = "mathtutor_chinese";
const DB_VERSION = 1;
const STORE_NAME = "answers";

export interface AnswerRecord {
  questionId: string;
  timesSeen: number;
  timesWrong: number;
  lastAnswer: number | string | null;
  lastSeen: string;
  lastCorrect: string | null;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "questionId" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getRecord(questionId: string): Promise<AnswerRecord | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(questionId);
    req.onsuccess = () => resolve((req.result as AnswerRecord | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllRecords(): Promise<AnswerRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as AnswerRecord[]);
    req.onerror = () => reject(req.error);
  });
}

export async function recordAnswer(
  questionId: string,
  isCorrect: boolean,
  answer: number | string,
  now: string,
): Promise<void> {
  const db = await openDB();
  const existing = await getRecord(questionId);
  const record: AnswerRecord = existing
    ? {
        ...existing,
        timesSeen: existing.timesSeen + 1,
        timesWrong: isCorrect ? existing.timesWrong : existing.timesWrong + 1,
        lastAnswer: answer,
        lastSeen: now,
        lastCorrect: isCorrect ? now : existing.lastCorrect,
      }
    : {
        questionId,
        timesSeen: 1,
        timesWrong: isCorrect ? 0 : 1,
        lastAnswer: answer,
        lastSeen: now,
        lastCorrect: isCorrect ? now : null,
      };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function importRecords(records: AnswerRecord[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    for (const r of records) {
      store.put(r);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
