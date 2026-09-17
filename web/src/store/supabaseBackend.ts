import type { SupabaseClient } from '@supabase/supabase-js';
import type { PlayerEvent } from '../core/events';
import { EMPTY_SUMMARY, parseImported, parseStats, type ImportedProfile, type PlayerRecord, type PlayerSummary } from '../core/player';
import { isPracticeMode } from '../core/operation';
import type { ModeStats } from '../core/stats';
import type { AuthClient, AuthUser, Backend, PlayerListing } from './backend';

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

    async resetPlayer(playerId: string): Promise<void> {
      const { error } = await client.rpc('reset_player', { pid: playerId });
      if (error) fail(error);
    },

    async deletePlayer(playerId: string): Promise<void> {
      // A válaszok a players sor törlésével cascade-del mennek (schema.sql).
      const { error } = await client.from('players').delete().eq('id', playerId);
      if (error) fail(error);
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
    async deleteAccount() {
      const { error } = await client.rpc('delete_account');
      if (error) fail(error);
      await client.auth.signOut({ scope: 'local' }).catch(() => {});
    },
  };
}
