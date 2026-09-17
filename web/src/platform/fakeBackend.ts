import type { PlayerEvent } from '../core/events';
import { EMPTY_SUMMARY, type ImportedProfile, type PlayerRecord, type PlayerSummary } from '../core/player';
import type { AuthClient, AuthUser, Backend, PlayerListing } from '../store/backend';
import type { KeyValueStorage } from '../store/storage';

const USER_KEY = 'matecska.fake.user';
const DB_KEY = 'matecska.fake.db';

/**
 * Szerver nélküli utánzat fejlesztéshez (`VITE_FAKE_BACKEND=1` a .env.local-ban): bármilyen
 * hatjegyű kódot elfogad, a „szerver" adatai a helyi tárolóban élnek. Éles buildbe nem kerül.
 */
export function fakeServices(storage: KeyValueStorage): { auth: AuthClient; backend: Backend } {
  const listeners = new Set<(user: AuthUser | null) => void>();
  let players: PlayerRecord[] = [];
  const events = new Map<string, PlayerEvent>();
  let loaded: Promise<void> | null = null;
  const latency = async () => {
    loaded ??= storage.get(DB_KEY).then((json) => {
      if (!json) return;
      const db = JSON.parse(json) as { players: PlayerRecord[]; events: PlayerEvent[] };
      players = db.players;
      db.events.forEach((e) => events.set(e.id, e));
    });
    await loaded;
    await new Promise((r) => setTimeout(r, 150));
  };
  const persist = () => storage.set(DB_KEY, JSON.stringify({ players, events: [...events.values()] }));

  const summaryOf = (playerId: string): PlayerSummary => {
    const summary: PlayerSummary = { pointsDelta: 0, stats: {} };
    for (const e of events.values()) {
      if (e.playerId !== playerId) continue;
      summary.pointsDelta += e.points;
      const prev = summary.stats[e.operation] ?? { solved: 0, correct: 0 };
      summary.stats[e.operation] = { solved: prev.solved + 1, correct: prev.correct + (e.correct ? 1 : 0) };
    }
    return summary;
  };

  const emit = (user: AuthUser | null) => listeners.forEach((l) => l(user));

  const auth: AuthClient = {
    async currentUser() {
      const json = await storage.get(USER_KEY);
      return json ? (JSON.parse(json) as AuthUser) : null;
    },
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async requestCode() {
      await latency();
    },
    async verifyCode(email, code) {
      await latency();
      if (!/^\d{6}$/.test(code)) throw new Error('Token has expired or is invalid');
      const user = { id: 'fake-user', email };
      await storage.set(USER_KEY, JSON.stringify(user));
      emit(user);
      return user;
    },
    async signOut() {
      await storage.remove(USER_KEY);
      emit(null);
    },
    async deleteAccount() {
      players = [];
      events.clear();
      await Promise.all([storage.remove(USER_KEY), storage.remove(DB_KEY)]);
      emit(null);
    },
  };

  const backend: Backend = {
    async listPlayers(): Promise<PlayerListing[]> {
      await latency();
      return players.map((player) => ({ player, summary: summaryOf(player.id) }));
    },
    async createPlayer(name: string, imported: ImportedProfile | null) {
      await latency();
      const player: PlayerRecord = {
        id: `fake-${players.length + 1}`,
        name,
        selectedCharacterID: 'cat',
        imported,
        pointAdjustment: 0,
        askOperands: false,
        createdAt: new Date().toISOString(),
      };
      players.push(player);
      await persist();
      return player;
    },
    async updatePlayer(player) {
      await latency();
      const i = players.findIndex((p) => p.id === player.id);
      if (i >= 0) players[i] = player;
      await persist();
    },
    async pushEvents(batch) {
      await latency();
      for (const e of batch) if (!events.has(e.id)) events.set(e.id, e);
      await persist();
    },
    async fetchSummary(playerId) {
      await latency();
      return players.some((p) => p.id === playerId) ? summaryOf(playerId) : EMPTY_SUMMARY;
    },
    async deletePlayer(playerId) {
      await latency();
      players = players.filter((p) => p.id !== playerId);
      for (const [id, e] of events) if (e.playerId === playerId) events.delete(id);
      await persist();
    },
    async resetPlayer(playerId) {
      await latency();
      for (const [id, e] of events) if (e.playerId === playerId) events.delete(id);
      const i = players.findIndex((p) => p.id === playerId);
      if (i >= 0) players[i] = { ...players[i], imported: null, selectedCharacterID: 'cat', pointAdjustment: 0 };
      await persist();
    },
  };

  return { auth, backend };
}
