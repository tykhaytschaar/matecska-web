import { capacitorStorage } from '../store/capacitorStorage';
import { browserStorage, type KeyValueStorage } from '../store/storage';
import { IS_NATIVE } from './native';

/** Natív appban Preferences, böngészőben localStorage. */
export function platformStorage(): KeyValueStorage {
  return IS_NATIVE ? capacitorStorage() : browserStorage();
}
