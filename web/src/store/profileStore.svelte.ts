import type { GameCharacter } from '../core/characters';
import type { MathOperation } from '../core/operation';
import { dummyProfile, recordScore, selectCharacter, unlockCharacter, type PlayerProfile } from '../core/profile';
import type { ScoreBreakdown } from '../core/scoring';
import { loadProfile, saveProfile } from './persistence';
import type { ProfileStorage } from './storage';

/** Reaktív profil-állapot: minden módosítás új profilt ad és azonnal ment. */
export class ProfileStore {
  profile = $state<PlayerProfile>(dummyProfile());
  /** Igaz, ha a tárolóból már betöltődött a mentett profil. */
  ready = $state(false);

  constructor(private readonly storage: ProfileStorage) {
    void this.load();
  }

  private async load(): Promise<void> {
    this.profile = await loadProfile(this.storage);
    this.ready = true;
  }

  record(score: ScoreBreakdown, correct: boolean, operation: MathOperation): void {
    this.commit(recordScore(this.profile, score, correct, operation));
  }

  select(character: GameCharacter): void {
    this.commit(selectCharacter(this.profile, character));
  }

  unlock(character: GameCharacter): boolean {
    const next = unlockCharacter(this.profile, character);
    if (!next) return false;
    this.commit(next);
    return true;
  }

  private commit(profile: PlayerProfile): void {
    this.profile = profile;
    void saveProfile(this.storage, profile);
  }
}
