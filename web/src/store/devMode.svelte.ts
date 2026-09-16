import type { KeyValueStorage } from './storage';

const KEY = 'matecska.devMode';
/** Ennyi koppintás a verziósorra kapcsolja a fejlesztői módot. */
export const DEV_MODE_TAPS = 7;

/** Rejtett fejlesztői mód, a készüléken megjegyezve. */
export class DevMode {
  on = $state(false);

  constructor(private readonly storage: KeyValueStorage) {
    void this.storage.get(KEY).then((v) => (this.on = v === '1'));
  }

  toggle(): void {
    this.on = !this.on;
    void (this.on ? this.storage.set(KEY, '1') : this.storage.remove(KEY));
  }
}
