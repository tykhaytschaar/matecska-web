import { Capacitor } from '@capacitor/core';

/** Natív (Capacitor) appban fut-e: iOS/Android. Weben és a fejlesztői szerveren hamis. */
export const IS_NATIVE = Capacitor.isNativePlatform();
