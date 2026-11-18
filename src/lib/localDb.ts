// Offline-First Local Persistence Engine (IndexedDB + LocalStorage Mirror)
// Stores all Personal Time Tracker data locally on the user's machine with zero cloud dependencies.

const DB_NAME = 'PersonalTimeTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'desk_store';
const LS_PREFIX = 'ptt_offline_';
const TS_PREFIX = '__ts_';

export const STORAGE_KEYS = {
  PROFILE: 'profile',
  TIME_ENTRIES: 'timeEntries',
  VAULT_ENTRIES: 'vaultEntries',
  HOURLY_REVIEW_QUEUE: 'hourlyReviewQueue',
  HOURLY_REMINDER_PREFS: 'hourlyReminderPrefs',
  TO_FILL_GAPS: 'toFillGaps',
  CUSTOM_HABITS: 'customHabits',
  ACHIEVEMENTS: 'achievements',
  TICKER_SETTINGS: 'tickerSettings',
  APP_STATE: 'appState',
  TUTORIAL_PREFS: 'tutorialPrefs',
} as const;

export const UI_PREF_KEYS = [
  'ptt_studio_theme_v1',
  'ptt_studio_text_style_v1',
  'ptt_progress_template_v1',
] as const;

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

function getLsTimestamp(key: string): number {
  try {
    const raw = localStorage.getItem(`${LS_PREFIX}${TS_PREFIX}${key}`);
    const parsed = raw ? Number(raw) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

function readLsRawEntry<T>(key: string): { found: boolean; value: T | null; ts: number } {
  try {
    const raw = localStorage.getItem(`${LS_PREFIX}${key}`);
    if (raw !== null) {
      const parsed = JSON.parse(raw) as T;
      if (parsed !== null && parsed !== undefined) {
        return { found: true, value: parsed, ts: getLsTimestamp(key) };
      }
    }
    // Migrate legacy key if present from earliest versions
    if (key === STORAGE_KEYS.CUSTOM_HABITS) {
      const legacy = localStorage.getItem('personal_desk_habits');
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy) as T;
        if (parsedLegacy !== null && parsedLegacy !== undefined) {
          return { found: true, value: parsedLegacy, ts: 0 };
        }
      }
    }
  } catch (err) {
    console.warn(`LocalStorage read error for ${key}:`, err);
  }
  return { found: false, value: null, ts: 0 };
}

function mirrorToLocalStorage<T>(key: string, value: T, ts: number): void {
  try {
    localStorage.setItem(`${LS_PREFIX}${key}`, JSON.stringify(value));
    if (ts > 0) {
      localStorage.setItem(`${LS_PREFIX}${TS_PREFIX}${key}`, String(ts));
    }
  } catch (err) {
    console.warn(`LocalStorage mirror error for ${key}:`, err);
  }
}

async function mirrorToIndexedDb<T>(key: string, value: T, ts: number): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(value, key);
      if (ts > 0) {
        store.put(ts, `${TS_PREFIX}${key}`);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn(`IndexedDB mirror fallback used for ${key}:`, err);
  }
}

function extractUpdatedAtMs(val: unknown): number {
  if (val && typeof val === 'object' && 'updatedAt' in val) {
    const raw = (val as { updatedAt?: unknown }).updatedAt;
    if (typeof raw === 'string') {
      const ms = Date.parse(raw);
      return Number.isFinite(ms) ? ms : 0;
    }
  }
  return 0;
}

/**
 * Synchronous read from LocalStorage for instant zero-flicker hydration on boot
 */
export function readLocalSync<T>(key: string, fallback: T): T {
  const entry = readLsRawEntry<T>(key);
  if (entry.found && entry.value !== null) {
    return entry.value;
  }
  return fallback;
}

/**
 * Asynchronous read from IndexedDB with timestamp-reconciled LocalStorage fallback.
 * Guarantees neither store silently overwrites a newer write from the other store,
 * and seamlessly upgrades legacy untimestamped records from older app versions.
 */
export async function readLocalAsync<T>(key: string, fallback: T): Promise<T> {
  const lsEntry = readLsRawEntry<T>(key);

  try {
    const db = await openDatabase();
    const idbData = await new Promise<{ found: boolean; value: T | undefined; ts: number }>(
      (resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const valReq = store.get(key);
        const tsReq = store.get(`${TS_PREFIX}${key}`);

        let valResult: T | undefined;
        let tsResult = 0;

        valReq.onsuccess = () => {
          valResult = valReq.result as T | undefined;
        };
        tsReq.onsuccess = () => {
          const parsedTs = typeof tsReq.result === 'number' ? tsReq.result : 0;
          tsResult = Number.isFinite(parsedTs) ? parsedTs : 0;
        };

        tx.oncomplete = () => {
          resolve({
            found: valResult !== undefined && valResult !== null,
            value: valResult,
            ts: tsResult,
          });
        };
        tx.onerror = () => {
          resolve({ found: false, value: undefined, ts: 0 });
        };
      }
    );

    // Case 1: Both IndexedDB and LocalStorage hold records -> reconcile safely
    if (idbData.found && idbData.value !== undefined && lsEntry.found && lsEntry.value !== null) {
      if (lsEntry.ts > idbData.ts) {
        // LocalStorage has a newer write (e.g. tab closed before async IDB completed)
        void mirrorToIndexedDb(key, lsEntry.value, lsEntry.ts);
        return lsEntry.value;
      }

      if (idbData.ts > lsEntry.ts) {
        mirrorToLocalStorage(key, idbData.value, idbData.ts);
        return idbData.value;
      }

      // Neither has explicit timestamps yet (friends upgrading from an earlier version)
      if (idbData.ts === 0 && lsEntry.ts === 0) {
        const idbUpdatedAt = extractUpdatedAtMs(idbData.value);
        const lsUpdatedAt = extractUpdatedAtMs(lsEntry.value);
        if (lsUpdatedAt > idbUpdatedAt) {
          void mirrorToIndexedDb(key, lsEntry.value, lsUpdatedAt);
          return lsEntry.value;
        }
        if (Array.isArray(idbData.value) && Array.isArray(lsEntry.value)) {
          if (lsEntry.value.length > idbData.value.length) {
            void mirrorToIndexedDb(key, lsEntry.value, Date.now());
            return lsEntry.value;
          }
        }
      }

      return idbData.value;
    }

    // Case 2: Only IndexedDB has data -> heal LocalStorage
    if (idbData.found && idbData.value !== undefined) {
      mirrorToLocalStorage(key, idbData.value, idbData.ts);
      return idbData.value;
    }

    // Case 3: Only LocalStorage has data (fresh IDB or legacy migration) -> heal IndexedDB
    if (lsEntry.found && lsEntry.value !== null) {
      void mirrorToIndexedDb(key, lsEntry.value, lsEntry.ts || Date.now());
      return lsEntry.value;
    }

    return fallback;
  } catch {
    return lsEntry.found && lsEntry.value !== null ? lsEntry.value : fallback;
  }
}

/**
 * Write data reliably to both IndexedDB and LocalStorage with unified write timestamp
 */
export async function writeLocalData<T>(key: string, value: T): Promise<void> {
  const nowTs = Date.now();
  mirrorToLocalStorage(key, value, nowTs);
  await mirrorToIndexedDb(key, value, nowTs);
}

export interface TrackerBackupPayload {
  app: 'PersonalTimeTracker';
  backupVersion: 1;
  exportedAt: string;
  data: Record<string, unknown>;
  uiPrefs: Record<string, string>;
}

/**
 * Export all local data and UI studio preferences into a portable JSON object
 */
export async function exportAllLocalData(): Promise<TrackerBackupPayload> {
  const keys = Object.values(STORAGE_KEYS);
  const data: Record<string, unknown> = {};

  await Promise.all(
    keys.map(async (key) => {
      const val = await readLocalAsync<unknown>(key, undefined);
      if (val !== undefined) {
        data[key] = val;
      }
    })
  );

  const uiPrefs: Record<string, string> = {};
  try {
    UI_PREF_KEYS.forEach((prefKey) => {
      const val = localStorage.getItem(prefKey);
      if (val !== null) {
        uiPrefs[prefKey] = val;
      }
    });
  } catch {
    // ignore storage read failure
  }

  return {
    app: 'PersonalTimeTracker',
    backupVersion: 1,
    exportedAt: new Date().toISOString(),
    data,
    uiPrefs,
  };
}

/**
 * Safely restore a backup JSON payload into both LocalStorage and IndexedDB
 */
export async function importAllLocalData(
  rawPayload: unknown
): Promise<{ keysRestored: number; entriesCount: number }> {
  if (!rawPayload || typeof rawPayload !== 'object') {
    throw new Error('Invalid backup file: expected a JSON object.');
  }

  const obj = rawPayload as Record<string, unknown>;
  const dataSource =
    obj.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>) : obj;

  const validKeys = new Set<string>(Object.values(STORAGE_KEYS));
  let keysRestored = 0;
  let entriesCount = 0;

  for (const [key, value] of Object.entries(dataSource)) {
    if (!validKeys.has(key) || value === undefined || value === null) continue;
    await writeLocalData(key, value);
    keysRestored++;
    if (key === STORAGE_KEYS.TIME_ENTRIES && Array.isArray(value)) {
      entriesCount = value.length;
    }
  }

  if (keysRestored === 0) {
    throw new Error('No recognized Personal Time Tracker records found in backup file.');
  }

  if (obj.uiPrefs && typeof obj.uiPrefs === 'object') {
    const prefs = obj.uiPrefs as Record<string, unknown>;
    try {
      UI_PREF_KEYS.forEach((prefKey) => {
        const v = prefs[prefKey];
        if (typeof v === 'string' && v.trim()) {
          localStorage.setItem(prefKey, v);
        }
      });
    } catch {
      // ignore storage write failure
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ptt-data-imported'));
  }

  return { keysRestored, entriesCount };
}
