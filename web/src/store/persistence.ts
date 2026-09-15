import { dummyProfile, parseProfile, serializeProfile, type PlayerProfile } from '../core/profile';
import type { ProfileStorage } from './storage';

export async function loadProfile(storage: ProfileStorage): Promise<PlayerProfile> {
  const json = await storage.load();
  return (json && parseProfile(json)) || dummyProfile();
}

export async function saveProfile(storage: ProfileStorage, profile: PlayerProfile): Promise<void> {
  await storage.save(serializeProfile(profile));
}
