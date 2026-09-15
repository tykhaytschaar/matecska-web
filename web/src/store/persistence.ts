import { dummyProfile, parseProfile, serializeProfile, type PlayerProfile } from '../core/profile';
import type { ProfileStorage } from './storage';

export function loadProfile(storage: ProfileStorage): PlayerProfile {
  const json = storage.load();
  return (json && parseProfile(json)) || dummyProfile();
}

export function saveProfile(storage: ProfileStorage, profile: PlayerProfile): void {
  storage.save(serializeProfile(profile));
}
