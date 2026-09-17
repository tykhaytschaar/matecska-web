import type { AuthClient, AuthStatus, AuthUser } from './backend';

/** Reaktív bejelentkezési állapot a szülő fiókjához. */
export class AccountStore {
  status = $state<AuthStatus>('loading');
  user = $state<AuthUser | null>(null);

  private unsubscribe: (() => void) | null = null;

  constructor(private readonly auth: AuthClient) {
    void this.start();
  }

  private async start(): Promise<void> {
    this.unsubscribe = this.auth.onChange((user) => this.apply(user));
    try {
      this.apply(await this.auth.currentUser());
    } catch {
      this.apply(null);
    }
  }

  private apply(user: AuthUser | null): void {
    // Token-frissítésnél (pl. előtérbe kerüléskor) ugyanaz a felhasználó jön újra: nem cseréljük az
    // objektumot, különben a képernyők újraépülnének és a folyamatban lévő lépés (pl. törlés) elveszne.
    if (user && this.user && user.id === this.user.id && user.email === this.user.email) return;
    this.user = user;
    this.status = user ? 'signedIn' : 'signedOut';
  }

  requestCode(email: string): Promise<void> {
    return this.auth.requestCode(email.trim().toLowerCase());
  }

  async verifyCode(email: string, code: string): Promise<void> {
    this.apply(await this.auth.verifyCode(email.trim().toLowerCase(), code.replace(/\s+/g, '')));
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    this.apply(null);
  }

  async deleteAccount(code: string): Promise<void> {
    await this.auth.deleteAccount(code);
    this.apply(null);
  }

  dispose(): void {
    this.unsubscribe?.();
  }
}
