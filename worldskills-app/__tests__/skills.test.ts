import { WORLDSKILLS_SKILLS } from '../lib/skills';

describe('WorldSkills szakmák', () => {
  test('Legalább 30 szakma van', () => {
    expect(WORLDSKILLS_SKILLS.length).toBeGreaterThanOrEqual(30);
  });

  test('Nincsenek duplikátumok', () => {
    const unique = new Set(WORLDSKILLS_SKILLS);
    expect(unique.size).toBe(WORLDSKILLS_SKILLS.length);
  });

  test('Minden szakma nem üres string', () => {
    WORLDSKILLS_SKILLS.forEach((skill) => {
      expect(typeof skill).toBe('string');
      expect(skill.trim().length).toBeGreaterThan(0);
    });
  });

  test('Tartalmazza a fő szakmákat', () => {
    expect(WORLDSKILLS_SKILLS).toContain('Webfejlesztő');
    expect(WORLDSKILLS_SKILLS).toContain('Villanyszerelő');
    expect(WORLDSKILLS_SKILLS).toContain('Szakács');
    expect(WORLDSKILLS_SKILLS).toContain('Fodrász');
    expect(WORLDSKILLS_SKILLS).toContain('Hegesztő');
  });

  test('Tartalmaz "Egyéb" opciót', () => {
    expect(WORLDSKILLS_SKILLS).toContain('Egyéb');
  });

  test('Ékezetes karakterek helyesek', () => {
    const accented = WORLDSKILLS_SKILLS.filter((s) => /[áéíóöőúüű]/i.test(s));
    expect(accented.length).toBeGreaterThan(10);
  });
});
