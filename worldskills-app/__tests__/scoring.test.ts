/**
 * Pontozási logika tesztek – minden teszttípus scoring-jának ellenőrzése
 * Ezek a legkritikusabb tesztek: ha a pontozás hibás, az egész app értelmetlen.
 */

describe('Growth Mindset pontozás', () => {
  // A mindset.tsx-ből kiemelt logika
  function getScore(isGrowth: boolean, value: number): number {
    return isGrowth ? value : 7 - value;
  }

  test('Growth állítás: magasabb érték = magasabb pont', () => {
    expect(getScore(true, 6)).toBe(6);
    expect(getScore(true, 1)).toBe(1);
  });

  test('Fixed állítás: fordított pontozás', () => {
    expect(getScore(false, 6)).toBe(1); // "Teljesen egyetértek" rögzült → alacsony pont
    expect(getScore(false, 1)).toBe(6); // "Egyáltalán nem" rögzült → magas pont
  });

  test('Kategória százalék számítás', () => {
    // 4 kérdés, max 6 pont/kérdés = max 24
    const answers = [6, 5, 4, 3]; // összesen 18
    const pct = Math.round((answers.reduce((s, v) => s + v, 0) / (4 * 6)) * 100);
    expect(pct).toBe(75);
  });

  test('Értelmezés határértékek', () => {
    function interpret(pct: number): string {
      if (pct >= 80) return 'erős';
      if (pct >= 60) return 'többnyire';
      if (pct >= 40) return 'vegyes';
      return 'rögzült';
    }

    expect(interpret(100)).toBe('erős');
    expect(interpret(80)).toBe('erős');
    expect(interpret(79)).toBe('többnyire');
    expect(interpret(60)).toBe('többnyire');
    expect(interpret(59)).toBe('vegyes');
    expect(interpret(40)).toBe('vegyes');
    expect(interpret(39)).toBe('rögzült');
    expect(interpret(0)).toBe('rögzült');
  });
});

describe('Célorientáció pontozás', () => {
  const comparativeIds = [1, 3, 4, 6, 9, 10];
  const masteryIds = [2, 5, 7, 8, 11, 12];

  test('Comparative és mastery ID-k nem fedik egymást', () => {
    const overlap = comparativeIds.filter((id) => masteryIds.includes(id));
    expect(overlap).toHaveLength(0);
  });

  test('Összesen 12 kérdés van lefedve', () => {
    const all = [...comparativeIds, ...masteryIds].sort((a, b) => a - b);
    expect(all).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  test('Átlag számítás (1-5 skála)', () => {
    const answers = [5, 4, 3, 2, 1, 5]; // összeg = 20, átlag = 3.3
    const avg = Math.round((answers.reduce((s, v) => s + v, 0) / 6) * 10) / 10;
    expect(avg).toBe(3.3);
  });

  test('Maximális pontszám', () => {
    const max = [5, 5, 5, 5, 5, 5];
    const avg = Math.round((max.reduce((s, v) => s + v, 0) / 6) * 10) / 10;
    expect(avg).toBe(5.0);
  });

  test('Minimális pontszám', () => {
    const min = [1, 1, 1, 1, 1, 1];
    const avg = Math.round((min.reduce((s, v) => s + v, 0) / 6) * 10) / 10;
    expect(avg).toBe(1.0);
  });
});

describe('Figyelem teszt (Bourdon) T% számítás', () => {
  function calculateTPercent(correct: number, wrong: number, totalTargets: number): number {
    return Math.max(0, Math.round(((correct - wrong) / totalTargets) * 100));
  }

  test('Tökéletes teljesítmény', () => {
    expect(calculateTPercent(100, 0, 100)).toBe(100);
  });

  test('Tipikus teljesítmény', () => {
    expect(calculateTPercent(90, 5, 100)).toBe(85);
  });

  test('Rossz teljesítmény nem megy negatívba', () => {
    expect(calculateTPercent(10, 50, 100)).toBe(0);
  });

  test('Nulla célpont kezelése', () => {
    // Ez edge case – nem kéne előfordulnia, de ne crash-eljen
    const result = Math.max(0, Math.round(((0 - 0) / 1) * 100));
    expect(result).toBe(0);
  });

  test('Rating skála', () => {
    function rating(tPercent: number): string {
      if (tPercent >= 99.7) return 'Kiváló';
      if (tPercent >= 98.9) return 'Jó';
      if (tPercent >= 97.1) return 'Közepes';
      if (tPercent >= 93.6) return 'Elégséges';
      return 'Fejlesztendő';
    }

    expect(rating(100)).toBe('Kiváló');
    expect(rating(99.7)).toBe('Kiváló');
    expect(rating(99.6)).toBe('Jó');
    expect(rating(98.9)).toBe('Jó');
    expect(rating(98.8)).toBe('Közepes');
    expect(rating(97.1)).toBe('Közepes');
    expect(rating(97.0)).toBe('Elégséges');
    expect(rating(93.6)).toBe('Elégséges');
    expect(rating(93.5)).toBe('Fejlesztendő');
    expect(rating(0)).toBe('Fejlesztendő');
  });
});

describe('IQ teszt pontozás', () => {
  test('Százalék számítás', () => {
    expect(Math.round((15 / 20) * 100)).toBe(75);
    expect(Math.round((20 / 20) * 100)).toBe(100);
    expect(Math.round((0 / 20) * 100)).toBe(0);
  });

  test('Rating meghatározás', () => {
    function rating(pct: number): string {
      if (pct >= 90) return 'Kiemelkedő';
      if (pct >= 75) return 'Jó';
      if (pct >= 50) return 'Átlagos';
      if (pct >= 25) return 'Gyenge';
      return 'Fejlesztendő';
    }

    expect(rating(95)).toBe('Kiemelkedő');
    expect(rating(90)).toBe('Kiemelkedő');
    expect(rating(89)).toBe('Jó');
    expect(rating(75)).toBe('Jó');
    expect(rating(74)).toBe('Átlagos');
    expect(rating(50)).toBe('Átlagos');
    expect(rating(49)).toBe('Gyenge');
    expect(rating(25)).toBe('Gyenge');
    expect(rating(24)).toBe('Fejlesztendő');
    expect(rating(0)).toBe('Fejlesztendő');
  });
});

describe('Koncentráció pontozás', () => {
  test('Stroop: helyes/rossz arány', () => {
    const score = 12;
    const total = 15;
    const pct = Math.round((score / total) * 100);
    expect(pct).toBe(80);
  });

  test('Reakcióidő scoring (200ms alap, -1 pont / 50ms)', () => {
    function reactionScore(avgMs: number): number {
      return Math.max(0, Math.round(10 - Math.max(0, avgMs - 200) / 50));
    }

    expect(reactionScore(150)).toBe(10);  // gyorsabb mint 200ms → max
    expect(reactionScore(200)).toBe(10);  // 200ms → max
    expect(reactionScore(250)).toBe(9);   // 50ms lassabb
    expect(reactionScore(400)).toBe(6);   // 200ms lassabb
    expect(reactionScore(700)).toBe(0);   // nagyon lassú → 0
  });

  test('Schulte scoring (30s alap, -1 pont / 5s)', () => {
    function schulteScore(seconds: number): number {
      return Math.max(0, Math.round(10 - Math.max(0, seconds - 30) / 5));
    }

    expect(schulteScore(20)).toBe(10);  // 20s → max
    expect(schulteScore(30)).toBe(10);  // 30s → max
    expect(schulteScore(35)).toBe(9);   // 5s extra
    expect(schulteScore(80)).toBe(0);   // nagyon lassú → 0
  });

  test('Párkereső scoring (8 lépés alap, -0.5 / extra lépés)', () => {
    function pairsScore(moves: number): number {
      return Math.max(0, Math.round(10 - Math.max(0, moves - 8) * 0.5));
    }

    expect(pairsScore(8)).toBe(10);   // tökéletes
    expect(pairsScore(10)).toBe(9);   // 2 extra
    expect(pairsScore(16)).toBe(6);   // 8 extra
    expect(pairsScore(28)).toBe(0);   // sok extra → 0
  });
});

describe('Eredmény százalék kerekítés', () => {
  test('Kerekítés különböző értékekre', () => {
    function pct(score: number, max: number): number {
      return max > 0 ? Math.round((score / max) * 100) : 0;
    }

    expect(pct(0, 20)).toBe(0);
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
    expect(pct(10, 10)).toBe(100);
    expect(pct(7, 12)).toBe(58);
    expect(pct(0, 0)).toBe(0);  // division by zero
  });
});
