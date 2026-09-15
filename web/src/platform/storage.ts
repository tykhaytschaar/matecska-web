import { Capacitor } from '@capacitor/core';
import { capacitorStorage } from '../store/capacitorStorage';
import { browserStorage, type ProfileStorage } from '../store/storage';

/** Natív appban Preferences, böngészőben localStorage. */
export function platformStorage(): ProfileStorage {
  return Capacitor.isNativePlatform() ? capacitorStorage() : browserStorage();
}
