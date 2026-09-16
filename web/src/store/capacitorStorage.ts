import { Preferences } from '@capacitor/preferences';
import type { KeyValueStorage } from './storage';

/**
 * Natív tároló Capacitor Preferences-szel (iOS: UserDefaults, Android: SharedPreferences).
 * Megbízhatóbb a WebView localStorage-ánál, amit a rendszer tárhelyhiánynál kiüríthet.
 */
export function capacitorStorage(): KeyValueStorage {
  return {
    get: async (key) => (await Preferences.get({ key })).value,
    set: async (key, value) => {
      await Preferences.set({ key, value });
    },
    remove: async (key) => {
      await Preferences.remove({ key });
    },
  };
}
