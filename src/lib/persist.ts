import type { Persisted } from "./types";

const DB_NAME = "gold-coins";
const STORE = "kv";
const KEY = "state";
const LS_KEY = "gold-coins-v1";

function normalize(raw: unknown): Persisted {
  const t = (raw && typeof raw === "object" ? { ...(raw as Persisted) } : {}) as Persisted;
  if (!Array.isArray(t.kids)) t.kids = [];
  if (!Array.isArray(t.customPrizes)) t.customPrizes = [];
  if (!t.wallets || typeof t.wallets !== "object") t.wallets = {};
  if (!Array.isArray(t.album)) t.album = [];
  if (!Array.isArray(t.sessions)) t.sessions = [];
  t.version = 1;
  return t;
}

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getFromDb(db: IDBDatabase) {
  return new Promise<Persisted | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve((req.result as Persisted) ?? null);
    req.onerror = () => reject(req.error);
  });
}

function putInDb(db: IDBDatabase, value: Persisted) {
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadState(): Promise<Persisted | null> {
  try {
    const db = await openDb();
    const row = await getFromDb(db);
    db.close();
    if (row) return normalize(row);
  } catch {
    /* fall through */
  }
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return null;
}

export async function saveState(state: Persisted) {
  const payload: Persisted = { ...state, version: 1 };
  try {
    const db = await openDb();
    await putInDb(db, payload);
    db.close();
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function snapshotOf(state: {
  kids: Persisted["kids"];
  customPrizes: Persisted["customPrizes"];
  wallets: Persisted["wallets"];
  album: Persisted["album"];
  sessions: Persisted["sessions"];
}): Persisted {
  return {
    version: 1,
    kids: state.kids,
    customPrizes: state.customPrizes,
    wallets: state.wallets,
    album: state.album,
    sessions: state.sessions,
  };
}

export function downloadSave(state: Persisted) {
  const blob = new Blob([JSON.stringify(state)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "matbeot-zahav.json";
  a.click();
  URL.revokeObjectURL(url);
}
