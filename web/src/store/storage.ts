/**
 * Kulcs–érték tároló absztrakciója. Aszinkron, hogy natív tároló (Capacitor Preferences)
 * és böngészős localStorage ugyanazon a felületen legyen elérhető.
 */
export interface KeyValueStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

/** A fiók előtti, egyprofilos változat kulcsa; az első játékos létrehozásakor átvesszük. */
export const LEGACY_PROFILE_KEY = 'matecska.profile';

export function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const map = new Map(Object.entries(initial));
  return {
    get: async (key) => map.get(key) ?? null,
    set: async (key, value) => {
      map.set(key, value);
    },
    remove: async (key) => {
      map.delete(key);
    },
  };
}

/** Böngészős tároló localStorage-ban; privát módban vagy letiltott tárhelynél némán tárolás nélkül fut. */
export function browserStorage(): KeyValueStorage {
  return {
    get: async (key) => {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    set: async (key, value) => {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {
        // nincs tárhely: a játék tárolás nélkül is működik
      }
    },
    remove: async (key) => {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {
        // nincs mit törölni
      }
    },
  };
}
