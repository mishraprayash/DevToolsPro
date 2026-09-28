/**
 * Asynchronous IndexedDB Storage Utility
 * Provides non-blocking, multi-megabyte client-side persistence for large tool inputs,
 * outputs, and history items without hitting the 5MB synchronous localStorage limits.
 */

const DB_NAME = 'DevToolsPro_DB';
const DB_VERSION = 1;
const STORE_NAME = 'tool_payloads';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function closeDB(db: IDBDatabase) {
  try {
    db.close();
  } catch {}
}

export async function idbSet<T = unknown>(key: string, value: T): Promise<void> {
  let db: IDBDatabase | null = null;
  try {
    db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ key, value, updatedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.warn('idbSet failed, falling back to memory/ignored:', err);
  } finally {
    if (db) closeDB(db);
  }
}

export async function idbGet<T = unknown>(key: string): Promise<T | null> {
  let db: IDBDatabase | null = null;
  try {
    db = await openDB();
    const result = await new Promise<T | null>((resolve, reject) => {
      const tx = db!.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result) resolve(req.result.value as T);
        else resolve(null);
      };
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
    return result;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.warn('idbGet failed:', err);
    return null;
  } finally {
    if (db) closeDB(db);
  }
}

export async function idbDelete(key: string): Promise<void> {
  let db: IDBDatabase | null = null;
  try {
    db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.warn('idbDelete failed:', err);
  } finally {
    if (db) closeDB(db);
  }
}

export async function idbClear(): Promise<void> {
  let db: IDBDatabase | null = null;
  try {
    db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.warn('idbClear failed:', err);
  } finally {
    if (db) closeDB(db);
  }
}
