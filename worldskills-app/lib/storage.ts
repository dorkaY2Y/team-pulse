import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorldSkillsSkill } from './skills';

const PROFILE_KEY = 'ws_user_profile';

export interface LocalProfile {
  name: string;
  skill: WorldSkillsSkill;
  setupComplete: boolean;
}

export async function saveLocalProfile(profile: LocalProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function getLocalProfile(): Promise<LocalProfile | null> {
  try {
    const data = await AsyncStorage.getItem(PROFILE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function clearLocalProfile(): Promise<void> {
  await AsyncStorage.removeItem(PROFILE_KEY);
}
