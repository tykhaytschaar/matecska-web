import { Preferences } from '@capacitor/preferences';
import { PROFILE_KEY, type ProfileStorage } from './storage';

/**
 * Natív tároló Capacitor Preferences-szel (iOS: UserDefaults, Android: SharedPreferences).
 * Megbízhatóbb a WebView localStorage-ánál, amit a rendszer tárhelyhiánynál kiüríthet.
 */
export function capacitorStorage(key: string = PROFILE_KEY): ProfileStorage {
  return {
    load: async () => (await Preferences.get({ key })).value,
    save: async (json) => {
      await Preferences.set({ key, value: json });
    },
  };
}
