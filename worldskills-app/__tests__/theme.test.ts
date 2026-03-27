import { theme } from '../lib/theme';

describe('WorldSkills téma', () => {
  test('Hivatalos brand színek megvannak', () => {
    expect(theme.colors.primary).toBe('#003764');
    expect(theme.colors.magenta).toBe('#D51067');
    expect(theme.colors.yellow).toBe('#FEE300');
    expect(theme.colors.teal).toBe('#0084AD');
    expect(theme.colors.orange).toBe('#FF6C0C');
    expect(theme.colors.purple).toBe('#4A0D66');
    expect(theme.colors.cyan).toBe('#72D0EB');
  });

  test('Minden szín érvényes hex formátum', () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    const colorEntries = Object.entries(theme.colors).filter(
      ([key]) => !['overlay', 'warning'].includes(key)
    );
    colorEntries.forEach(([key, value]) => {
      if (typeof value === 'string' && !value.startsWith('rgba')) {
        expect(value).toMatch(hexRegex);
      }
    });
  });

  test('Betűméretek növekvő sorrendben', () => {
    expect(theme.fontSizes.xs).toBeLessThan(theme.fontSizes.sm);
    expect(theme.fontSizes.sm).toBeLessThan(theme.fontSizes.md);
    expect(theme.fontSizes.md).toBeLessThan(theme.fontSizes.lg);
    expect(theme.fontSizes.lg).toBeLessThan(theme.fontSizes.xl);
    expect(theme.fontSizes.xl).toBeLessThan(theme.fontSizes.xxl);
    expect(theme.fontSizes.xxl).toBeLessThan(theme.fontSizes.hero);
  });

  test('Spacing növekvő sorrendben', () => {
    expect(theme.spacing.xs).toBeLessThan(theme.spacing.sm);
    expect(theme.spacing.sm).toBeLessThan(theme.spacing.md);
    expect(theme.spacing.md).toBeLessThan(theme.spacing.lg);
    expect(theme.spacing.lg).toBeLessThan(theme.spacing.xl);
    expect(theme.spacing.xl).toBeLessThan(theme.spacing.xxl);
  });

  test('Border radius növekvő sorrendben', () => {
    expect(theme.borderRadius.sm).toBeLessThan(theme.borderRadius.md);
    expect(theme.borderRadius.md).toBeLessThan(theme.borderRadius.lg);
    expect(theme.borderRadius.lg).toBeLessThan(theme.borderRadius.xl);
    expect(theme.borderRadius.xl).toBeLessThan(theme.borderRadius.full);
  });

  test('Shadow elevation növekvő', () => {
    expect(theme.shadows.sm.elevation).toBeLessThan(theme.shadows.md.elevation);
    expect(theme.shadows.md.elevation).toBeLessThan(theme.shadows.lg.elevation);
  });
});
