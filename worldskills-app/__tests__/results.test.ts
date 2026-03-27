import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveResult, getLocalResults, getMyResults, clearLocalResults, TestResult } from '../lib/results';
import { saveLocalProfile } from '../lib/storage';

beforeEach(() => {
  jest.clearAllMocks();
  const storage = (AsyncStorage as any).__mockStorage;
  Object.keys(storage).forEach((k) => delete storage[k]);
});

describe('Eredmény mentés', () => {
  test('Eredmény mentése és visszatöltése', async () => {
    await saveLocalProfile({ name: 'Teszt Elek', skill: 'Webfejlesztő' as any, setupComplete: true });

    const result = await saveResult('iq', 'IQ Teszt', 15, 20, 600);
    expect(result.name).toBe('Teszt Elek');
    expect(result.skill).toBe('Webfejlesztő');
    expect(result.score).toBe(15);
    expect(result.maxScore).toBe(20);
    expect(result.percentage).toBe(75);
    expect(result.timeTakenSeconds).toBe(600);
    expect(result.mode).toBe('practice');
    expect(result.id).toBeTruthy();
    expect(result.completedAt).toBeTruthy();
  });

  test('Százalék kerekítés helyesen működik', async () => {
    const r1 = await saveResult('iq', 'IQ', 1, 3, null);
    expect(r1.percentage).toBe(33); // 33.33... → 33

    const r2 = await saveResult('iq', 'IQ', 2, 3, null);
    expect(r2.percentage).toBe(67); // 66.66... → 67

    const r3 = await saveResult('iq', 'IQ', 0, 0, null);
    expect(r3.percentage).toBe(0); // division by zero handled
  });

  test('Több eredmény tárolása és sorrendje', async () => {
    await saveResult('iq', 'IQ Teszt', 10, 20, 100);
    await saveResult('mindset', 'Fejlődési Szemlélet', 50, 72, null);
    await saveResult('attention', 'Figyelem', 80, 100, 300);

    const results = await getLocalResults();
    expect(results).toHaveLength(3);
    // Legújabb elöl
    expect(results[0].testType).toBe('attention');
    expect(results[1].testType).toBe('mindset');
    expect(results[2].testType).toBe('iq');
  });

  test('Selection mód mentése', async () => {
    const result = await saveResult('iq', 'IQ', 15, 20, 600, {}, 'selection');
    expect(result.mode).toBe('selection');
  });

  test('Details objektum mentése', async () => {
    const details = { intelligence: 80, talent: 70, personality: 90 };
    const result = await saveResult('mindset', 'Mindset', 50, 72, null, details);
    expect(result.details).toEqual(details);
  });

  test('Profil nélkül "Ismeretlen" nevet kap', async () => {
    const result = await saveResult('iq', 'IQ', 10, 20, 100);
    expect(result.name).toBe('Ismeretlen');
    expect(result.skill).toBe('Ismeretlen');
  });
});

describe('Eredmény szűrés', () => {
  test('getMyResults csak a saját eredményeket adja', async () => {
    await saveLocalProfile({ name: 'Anna', skill: 'Fodrász' as any, setupComplete: true });
    await saveResult('iq', 'IQ', 10, 20, 100);

    // Szimulálunk más nevű eredményt
    const storage = (AsyncStorage as any).__mockStorage;
    const results = JSON.parse(storage['ws_test_results']);
    results.push({ ...results[0], id: 'other', name: 'Béla' });
    storage['ws_test_results'] = JSON.stringify(results);

    const myResults = await getMyResults();
    expect(myResults).toHaveLength(1);
    expect(myResults[0].name).toBe('Anna');

    const allResults = await getLocalResults();
    expect(allResults).toHaveLength(2);
  });
});

describe('Eredmény törlés', () => {
  test('clearLocalResults mindent töröl', async () => {
    await saveResult('iq', 'IQ', 10, 20, 100);
    await saveResult('mindset', 'Mindset', 50, 72, null);

    let results = await getLocalResults();
    expect(results).toHaveLength(2);

    await clearLocalResults();
    results = await getLocalResults();
    expect(results).toHaveLength(0);
  });
});
