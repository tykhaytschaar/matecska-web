import type { SupabaseClient } from '@supabase/supabase-js';
import type { PlayerEvent } from '../core/events';
import { EMPTY_SUMMARY, parseImported, parseStats, type ImportedProfile, type PlayerRecord, type PlayerSummary } from '../core/player';
import { isPracticeMode } from '../core/operation';
import type { ModeStats } from '../core/stats';
import { DeletionCodeError, type AuthClient, type AuthUser, type Backend, type PlayerListing } from './backend';

interface PlayerRow {
  id: string;
  name: string;
  selected_character_id: string;
  imported: unknown;
  point_adjustment: number | null;
  ask_operands: boolean | null;
  created_at: string;
}

interface SummaryRow {
  player_id: string;
  points_delta: number | string;
  stats: unknown;
}

function toRecord(row: PlayerRow): PlayerRecord {
  return {
    id: row.id,
    name: row.name,
    selectedCharacterID: row.selected_character_id,
    imported: parseImported(row.imported),
    pointAdjustment: Number(row.point_adjustment) || 0,
    askOperands: row.ask_operands === true,
    createdAt: row.created_at,
  };
}

function toSummary(row: SummaryRow): PlayerSummary {
  return {
    pointsDelta: Number(row.points_delta) || 0,
    stats: parseStats(row.stats),
  };
}

function fail(error: { message: string } | null): never {
  throw new Error(error?.message ?? 'ismeretlen hiba');
}

/** Megerősítő kód kérése a request-deletion Edge Functiontől; a hibákat a felület üzeneteire fordítja. */
export async function requestDeletionCode(client: SupabaseClient, kind: 'account' | 'player', playerId?: string): Promise<void> {
  const { error } = await client.functions.invoke('request-deletion', { body: { kind, playerId } });
  if (!error) return;
  const status = (error as { context?: { status?: number } }).context?.status;
  if (status === 429) throw new DeletionCodeError('Túl gyakori kérés, várj egy percet.', 'rate-limit');
  if (status === 502) throw new DeletionCodeError('A levél küldése nem sikerült.', 'send-failed');
  if (/fetch|network/i.test(error.message ?? '')) throw new DeletionCodeError('Nincs internetkapcsolat.', 'network');
  throw new DeletionCodeError('A kód kérése nem sikerült.', 'other');
}

/** A törlő függvények hibái: érvénytelen/lejárt kód vagy más. */
function toDeletionError(error: { message: string; code?: string }): DeletionCodeError {
  if (error.code === '22023' || /érvénytelen|lejárt/i.test(error.message)) return new DeletionCodeError('Hibás vagy lejárt kód.', 'invalid-code');
  if (/fetch|network/i.test(error.message)) return new DeletionCodeError('Nincs internetkapcsolat.', 'network');
  return new DeletionCodeError('A törlés nem sikerült.', 'other');
}

export function supabaseBackend(client: SupabaseClient): Backend {
  return {
    async listPlayers(): Promise<PlayerListing[]> {
      const players = await client.from('players').select('*').order('created_at');
      if (players.error) fail(players.error);
      const rows = (players.data ?? []) as PlayerRow[];
      if (rows.length === 0) return [];
      const summaries = await client
        .from('player_summaries')
        .select('*')
        .in('player_id', rows.map((r) => r.id));
      if (summaries.error) fail(summaries.error);
      const byId = new Map(((summaries.data ?? []) as SummaryRow[]).map((s) => [s.player_id, toSummary(s)]));
      return rows.map((row) => ({ player: toRecord(row), summary: byId.get(row.id) ?? EMPTY_SUMMARY }));
    },

    async createPlayer(name: string, imported: ImportedProfile | null): Promise<PlayerRecord> {
      const { data, error } = await client
        .from('players')
        .insert({ name: name.trim(), imported })
        .select('*')
        .single();
      if (error || !data) fail(error);
      return toRecord(data as PlayerRow);
    },

    async updatePlayer(player: PlayerRecord): Promise<void> {
      const { error } = await client
        .from('players')
        .update({
          name: player.name,
          selected_character_id: player.selectedCharacterID,
          imported: player.imported,
          point_adjustment: player.pointAdjustment,
          ask_operands: player.askOperands,
        })
        .eq('id', player.id);
      if (error) fail(error);
    },

    async pushEvents(events: PlayerEvent[]): Promise<void> {
      const attempts = events.map((e) => ({
          id: e.id,
          player_id: e.playerId,
          operation: e.operation,
          mode: e.mode,
          correct: e.correct,
          points: e.points,
          bonus: e.bonus ?? null,
          session_id: e.sessionId ?? null,
          task: e.detail?.task ?? null,
          answer: e.detail?.answer ?? null,
          elapsed_ms: e.detail?.elapsedMs ?? null,
          created_at: e.createdAt,
        }));
      if (attempts.length) {
        const { error } = await client.from('attempts').upsert(attempts, { onConflict: 'id', ignoreDuplicates: true });
        if (error) fail(error);
      }
    },

    async fetchSummary(playerId: string): Promise<PlayerSummary> {
      const { data, error } = await client.from('player_summaries').select('*').eq('player_id', playerId).maybeSingle();
      if (error) fail(error);
      return data ? toSummary(data as SummaryRow) : EMPTY_SUMMARY;
    },

    async fetchModeStats(playerId: string, since: Date | null): Promise<ModeStats[]> {
      const { data, error } = await client.rpc('mode_stats', { pid: playerId, since: since ? since.toISOString() : null });
      if (error) fail(error);
      const rows = (data ?? []) as { mode: string; solved: number | string; correct: number | string; bonus_sum: number | string | null; bonus_count: number | string }[];
      return rows
        .filter((r) => isPracticeMode(r.mode))
        .map((r) => ({
          mode: r.mode as ModeStats['mode'],
          solved: Number(r.solved) || 0,
          correct: Number(r.correct) || 0,
          bonusSum: Number(r.bonus_sum) || 0,
          bonusCount: Number(r.bonus_count) || 0,
        }));
    },

    async fetchSessionIds(playerId: string, since: Date | null): Promise<string[]> {
      const { data, error } = await client.rpc('session_ids', { pid: playerId, since: since ? since.toISOString() : null });
      if (error) fail(error);
      return ((data ?? []) as { session_id: string }[]).map((r) => r.session_id).filter((id) => typeof id === 'string');
    },

    async resetPlayer(playerId: string): Promise<void> {
      const { error } = await client.rpc('reset_player', { pid: playerId });
      if (error) fail(error);
    },

    requestDeletionCode: (kind, playerId) => requestDeletionCode(client, kind, playerId),

    async deletePlayer(playerId: string, code: string): Promise<void> {
      // Csak megerősítő kóddal, a delete_player függvényen át (a táblán nincs törlési jog).
      const { error } = await client.rpc('delete_player', { pid: playerId, code: code.trim() });
      if (error) throw toDeletionError(error);
    },
  };
}

export function supabaseAuth(client: SupabaseClient): AuthClient {
  const toUser = (u: { id: string; email?: string } | null | undefined): AuthUser | null =>
    u ? { id: u.id, email: u.email ?? '' } : null;
  return {
    async currentUser() {
      const { data } = await client.auth.getSession();
      return toUser(data.session?.user);
    },
    onChange(listener) {
      const { data } = client.auth.onAuthStateChange((_event, session) => listener(toUser(session?.user)));
      return () => data.subscription.unsubscribe();
    },
    async requestCode(email) {
      const { error } = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      if (error) fail(error);
    },
    async verifyCode(email, code) {
      const { data, error } = await client.auth.verifyOtp({ email, token: code, type: 'email' });
      if (error) fail(error);
      const user = toUser(data.user);
      if (!user) throw new Error('nem jött létre munkamenet');
      return user;
    },
    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) fail(error);
    },
    async deleteAccount(code) {
      const { error } = await client.rpc('delete_account', { code: code.trim() });
      if (error) throw toDeletionError(error);
      await client.auth.signOut({ scope: 'local' }).catch(() => {});
    },
  };
}
