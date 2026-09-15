/**
 * A profil tárolásának absztrakciója. Most localStorage; később Capacitor Preferences
 * vagy szerveroldali fiók kerülhet mögé a felület módosítása nélkül.
 */
export interface ProfileStorage {
  load(): string | null;
  save(json: string): void;
}

export const PROFILE_KEY = 'matecska.profile';

export function memoryStorage(initial: string | null = null): ProfileStorage {
  let value = initial;
  return {
    load: () => value,
    save: (json) => {
      value = json;
    },
  };
}

export function browserStorage(key: string = PROFILE_KEY): ProfileStorage {
  return {
    load: () => {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    save: (json) => {
      try {
        globalThis.localStorage?.setItem(key, json);
      } catch {
        // privát mód vagy letiltott tárhely: a játék tárolás nélkül is működik
      }
    },
  };
}
