import { Capacitor } from '@capacitor/core';
import { capacitorStorage } from '../store/capacitorStorage';
import { browserStorage, type KeyValueStorage } from '../store/storage';

/** Natív appban Preferences, böngészőben localStorage. */
export function platformStorage(): KeyValueStorage {
  return Capacitor.isNativePlatform() ? capacitorStorage() : browserStorage();
}
