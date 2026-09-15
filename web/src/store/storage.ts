/**
 * A profil tárolásának absztrakciója. Aszinkron, hogy natív tároló (Capacitor Preferences)
 * és később szerveroldali fiók is kerülhessen mögé a felület módosítása nélkül.
 */
export interface ProfileStorage {
  load(): Promise<string | null>;
  save(json: string): Promise<void>;
}

export const PROFILE_KEY = 'matecska.profile';

export function memoryStorage(initial: string | null = null): ProfileStorage {
  let value = initial;
  return {
    load: async () => value,
    save: async (json) => {
      value = json;
    },
  };
}

/** Böngészős tároló localStorage-ban; privát módban vagy letiltott tárhelynél némán tárolás nélkül fut. */
export function browserStorage(key: string = PROFILE_KEY): ProfileStorage {
  return {
    load: async () => {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    save: async (json) => {
      try {
        globalThis.localStorage?.setItem(key, json);
      } catch {
        // nincs tárhely: a játék tárolás nélkül is működik
      }
    },
  };
}
