// Offline-First Local Persistence Engine (IndexedDB + LocalStorage Mirror)
// Stores all Personal Time Tracker data locally on the user's machine with zero cloud dependencies.

const DB_NAME = 'PersonalTimeTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'desk_store';
const LS_PREFIX = 'ptt_offline_';

export const STORAGE_KEYS = {
  PROFILE: 'profile',
  TIME_ENTRIES: 'timeEntries',
  VAULT_ENTRIES: 'vaultEntries',
  REVIEW_ITEMS: 'reviewItems',
  TO_FILL_GAPS: 'toFillGaps',
  CUSTOM_HABITS: 'customHabits',
  WORD_RULES: 'wordRules',
  ACHIEVEMENTS: 'achievements',
  TICKER_SETTINGS: 'tickerSettings',
  APP_STATE: 'appState',
  TUTORIAL_PREFS: 'tutorialPrefs',
} as const;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Synchronous read from LocalStorage for instant zero-flicker hydration on boot
 */
export function readLocalSync<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${LS_PREFIX}${key}`);
    if (raw !== null) {
      return JSON.parse(raw) as T;
    }
    // Migrate legacy key if present
    if (key === STORAGE_KEYS.CUSTOM_HABITS) {
      const legacy = localStorage.getItem('personal_desk_habits');
      if (legacy) return JSON.parse(legacy) as T;
    }
  } catch (err) {
    console.warn(`LocalStorage read error for ${key}:`, err);
  }
  return fallback;
}

/**
 * Asynchronous read from IndexedDB with automatic LocalStorage fallback
 */
export async function readLocalAsync<T>(key: string, fallback: T): Promise<T> {
  try {
    const db = await openDatabase();
    return await new Promise<T>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        if (req.result !== undefined) {
          resolve(req.result as T);
        } else {
          resolve(readLocalSync(key, fallback));
        }
      };

      req.onerror = () => {
        resolve(readLocalSync(key, fallback));
      };
    });
  } catch {
    return readLocalSync(key, fallback);
  }
}

/**
 * Write data reliably to both IndexedDB and LocalStorage
 */
export async function writeLocalData<T>(key: string, value: T): Promise<void> {
  // 1. Instant LocalStorage mirror
  try {
    localStorage.setItem(`${LS_PREFIX}${key}`, JSON.stringify(value));
  } catch (err) {
    console.warn(`LocalStorage write error for ${key}:`, err);
  }

  // 2. Durable IndexedDB write
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`IndexedDB write fallback used for ${key}:`, err);
  }
}
