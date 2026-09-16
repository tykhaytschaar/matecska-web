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

  async deleteAccount(): Promise<void> {
    await this.auth.deleteAccount();
    this.apply(null);
  }

  dispose(): void {
    this.unsubscribe?.();
  }
}
