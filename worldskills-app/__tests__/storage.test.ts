import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveLocalProfile, getLocalProfile, clearLocalProfile, LocalProfile } from '../lib/storage';

beforeEach(() => {
  jest.clearAllMocks();
  const storage = (AsyncStorage as any).__mockStorage;
  Object.keys(storage).forEach((k) => delete storage[k]);
});

describe('Profil kezelés', () => {
  const testProfile: LocalProfile = {
    name: 'Teszt Elek',
    skill: 'Webfejlesztő' as any,
    setupComplete: true,
  };

  test('Profil mentése és visszatöltése', async () => {
    await saveLocalProfile(testProfile);
    const loaded = await getLocalProfile();
    expect(loaded).toEqual(testProfile);
  });

  test('Üres profil null-t ad vissza', async () => {
    const loaded = await getLocalProfile();
    expect(loaded).toBeNull();
  });

  test('Profil törlése', async () => {
    await saveLocalProfile(testProfile);
    await clearLocalProfile();
    const loaded = await getLocalProfile();
    expect(loaded).toBeNull();
  });

  test('Korrupt JSON nem okoz crash-t', async () => {
    await AsyncStorage.setItem('ws_user_profile', 'NOT_VALID_JSON{{{');
    const loaded = await getLocalProfile();
    expect(loaded).toBeNull();
  });

  test('Név és szakma helyesen mentődik', async () => {
    await saveLocalProfile({ name: 'Kovács Anna', skill: 'Fodrász' as any, setupComplete: true });
    const loaded = await getLocalProfile();
    expect(loaded?.name).toBe('Kovács Anna');
    expect(loaded?.skill).toBe('Fodrász');
    expect(loaded?.setupComplete).toBe(true);
  });
});
