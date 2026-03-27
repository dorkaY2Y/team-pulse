import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { saveResult } from '../../../lib/results';
import { Button } from '../../../components/Button';
import { theme } from '../../../lib/theme';

type GameState = 'menu' | 'playing' | 'result';

// Go/No-Go Continuous Performance Test (CPT)
// Symbols appear one at a time; tap if it matches a target, wait if not.

const SYMBOLS = ['◆', '●', '■', '▲', '★', '◇', '○', '□', '△', '☆', '♦', '♣', '♠', '♥'];
const TOTAL_STIMULI = 60;
const TARGET_COUNT = 15;
const STIMULUS_DURATION_MS = 1500;

interface Stimulus {
  symbol: string;
  isTarget: boolean;
}

interface ResultData {
  hits: number;
  misses: number;
  falseAlarms: number;
  totalTargets: number;
  accuracy: number;
  rating: string;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickTargets(): string[] {
  return shuffleArray(SYMBOLS).slice(0, 4);
}

function generateSequence(targets: string[]): Stimulus[] {
  const distractors = SYMBOLS.filter((s) => !targets.includes(s));
  const sequence: Stimulus[] = [];

  for (let i = 0; i < TARGET_COUNT; i++) {
    sequence.push({
      symbol: targets[Math.floor(Math.random() * targets.length)],
      isTarget: true,
    });
  }

  for (let i = 0; i < TOTAL_STIMULI - TARGET_COUNT; i++) {
    sequence.push({
      symbol: distractors[Math.floor(Math.random() * distractors.length)],
      isTarget: false,
    });
  }

  return shuffleArray(sequence);
}

function getRating(accuracy: number): string {
  if (accuracy >= 95) return 'Kiváló';
  if (accuracy >= 85) return 'Jó';
  if (accuracy >= 70) return 'Közepes';
  if (accuracy >= 55) return 'Elégséges';
  return 'Fejlesztendő';
}

const RATING_COLORS: Record<string, string> = {
  'Kiváló': theme.colors.success,
  'Jó': theme.colors.teal,
  'Közepes': theme.colors.orange,
  'Elégséges': theme.colors.yellow,
  'Fejlesztendő': theme.colors.error,
};

export default function AttentionScreen() {
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState>('menu');
  const [targets, setTargets] = useState<string[]>([]);
  const [sequence, setSequence] = useState<Stimulus[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responded, setResponded] = useState(false);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [falseAlarms, setFalseAlarms] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [resultData, setResultData] = useState<ResultData | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const respondedRef = useRef(false);
  const resultSavedRef = useRef(false);

  // Preview targets for menu (stable across renders)
  const menuTargets = useMemo(() => pickTargets(), []);

  // Keep respondedRef in sync
  useEffect(() => {
    respondedRef.current = responded;
  }, [responded]);

  // Auto-advance timer per stimulus
  useEffect(() => {
    if (gameState !== 'playing' || sequence.length === 0) return;
    if (currentIndex >= sequence.length) return;

    const currentStimulus = sequence[currentIndex];

    timerRef.current = setTimeout(() => {
      // If no response was given and it was a target, count as miss
      if (currentStimulus.isTarget && !respondedRef.current) {
        setMisses((prev) => prev + 1);
      }

      const nextIdx = currentIndex + 1;
      if (nextIdx >= sequence.length) {
        // Defer to avoid state conflicts
        setTimeout(() => setGameState('result'), 0);
        return;
      }

      setCurrentIndex(nextIdx);
      setResponded(false);
      respondedRef.current = false;
    }, STIMULUS_DURATION_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState, currentIndex, sequence]);

  // Elapsed time clock
  useEffect(() => {
    if (gameState === 'playing') {
      clockRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 500);
    }
    return () => {
      if (clockRef.current) {
        clearInterval(clockRef.current);
        clockRef.current = null;
      }
    };
  }, [gameState, startTime]);

  // Compute and save results when entering result state
  // We listen to hits/misses/falseAlarms so the effect re-runs once final state settles
  useEffect(() => {
    if (gameState !== 'result' || resultSavedRef.current) return;
    resultSavedRef.current = true;

    const totalTargets = sequence.filter((s) => s.isTarget).length;
    const accuracy = totalTargets > 0
      ? Math.max(0, Math.round(((hits - falseAlarms) / totalTargets) * 100))
      : 0;
    const rating = getRating(accuracy);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    const data: ResultData = { hits, misses, falseAlarms, totalTargets, accuracy, rating };
    setResultData(data);

    saveResult('attention', 'Figyelem Teszt (CPT)', hits, totalTargets, timeTaken, {
      ...data,
      totalStimuli: sequence.length,
    });
  }, [gameState, hits, misses, falseAlarms]);

  function startTest() {
    const tgts = pickTargets();
    const seq = generateSequence(tgts);

    resultSavedRef.current = false;
    setTargets(tgts);
    setSequence(seq);
    setCurrentIndex(0);
    setResponded(false);
    respondedRef.current = false;
    setHits(0);
    setMisses(0);
    setFalseAlarms(0);
    setResultData(null);
    setStartTime(Date.now());
    setElapsedSeconds(0);
    setGameState('playing');
  }

  function handleTap() {
    if (responded || currentIndex >= sequence.length) return;

    setResponded(true);
    respondedRef.current = true;

    const current = sequence[currentIndex];
    if (current.isTarget) {
      setHits((h) => h + 1);
    } else {
      setFalseAlarms((fa) => fa + 1);
    }

    // Clear the auto-advance timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Brief feedback delay then advance
    timerRef.current = setTimeout(() => {
      const nextIdx = currentIndex + 1;
      if (nextIdx >= sequence.length) {
        setGameState('result');
        return;
      }
      setCurrentIndex(nextIdx);
      setResponded(false);
      respondedRef.current = false;
    }, 300);
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  // ─── MENU ─────────────────────────────────────────────────────────
  if (gameState === 'menu') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.menuHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.black} />
          </TouchableOpacity>
          <Text style={styles.menuTitle}>Figyelem Teszt</Text>
        </View>

        <ScrollView contentContainerStyle={styles.menuContent}>
          <View style={styles.menuIcon}>
            <Ionicons name="eye-outline" size={64} color={theme.colors.navy} />
          </View>

          <Text style={styles.menuMainTitle}>Go/No-Go Teszt (CPT)</Text>
          <Text style={styles.menuDesc}>
            Szimbólumok jelennek meg egyenként a képernyő közepén. Ha a szimbólum megegyezik
            valamelyik célszimbólummal, koppints a JELÖLÉS gombra! Ha nem cél, csak várd meg a
            következőt.
          </Text>

          <View style={styles.targetPreview}>
            <Text style={styles.targetPreviewTitle}>Példa célszimbólumok:</Text>
            <View style={styles.targetSymbols}>
              {menuTargets.map((sym, i) => (
                <View key={i} style={styles.targetSymbolBox}>
                  <Text style={styles.targetSymbolText}>{sym}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.rulesCard}>
            <View style={styles.ruleRow}>
              <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
              <Text style={styles.ruleText}>Koppints, ha célszimbólumot látsz</Text>
            </View>
            <View style={styles.ruleRow}>
              <Ionicons name="close-circle" size={18} color={theme.colors.error} />
              <Text style={styles.ruleText}>Ne koppints, ha nem célszimbólum</Text>
            </View>
            <View style={styles.ruleRow}>
              <Ionicons name="time" size={18} color={theme.colors.orange} />
              <Text style={styles.ruleText}>Minden szimbólum 1.5 mp-ig látható</Text>
            </View>
            <View style={styles.ruleRow}>
              <Ionicons name="speedometer" size={18} color={theme.colors.teal} />
              <Text style={styles.ruleText}>60 szimbólum, ~25% cél</Text>
            </View>
          </View>

          <Text style={styles.menuInfo}>~2-3 perc</Text>
          <Button title="Teszt indítása" onPress={startTest} style={{ marginTop: theme.spacing.lg }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── RESULT ───────────────────────────────────────────────────────
  if (gameState === 'result' && resultData) {
    const ratingColor = RATING_COLORS[resultData.rating] || theme.colors.primary;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <Text style={styles.resultMainTitle}>Figyelem Teszt Eredmény</Text>

          <View style={[styles.resultCircle, { backgroundColor: ratingColor }]}>
            <Text style={styles.resultScore}>{resultData.accuracy}%</Text>
            <Text style={styles.resultLabel}>Pontosság</Text>
          </View>

          <View style={[styles.ratingBadge, { backgroundColor: ratingColor + '20' }]}>
            <Text style={[styles.ratingText, { color: ratingColor }]}>
              {resultData.rating}
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
              <Text style={styles.statValue}>{resultData.hits}</Text>
              <Text style={styles.statLabel}>Találat</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="alert-circle" size={24} color={theme.colors.orange} />
              <Text style={styles.statValue}>{resultData.misses}</Text>
              <Text style={styles.statLabel}>Kihagyott</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="close-circle" size={24} color={theme.colors.error} />
              <Text style={styles.statValue}>{resultData.falseAlarms}</Text>
              <Text style={styles.statLabel}>Téves jelölés</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="apps" size={24} color={theme.colors.primary} />
              <Text style={styles.statValue}>{resultData.totalTargets}</Text>
              <Text style={styles.statLabel}>Célok össz.</Text>
            </View>
          </View>

          <View style={styles.scaleCard}>
            <Text style={styles.scaleTitle}>Értékelési skála</Text>
            {[
              { label: 'Kiváló', range: '95 – 100%', color: theme.colors.success },
              { label: 'Jó', range: '85 – 94%', color: theme.colors.teal },
              { label: 'Közepes', range: '70 – 84%', color: theme.colors.orange },
              { label: 'Elégséges', range: '55 – 69%', color: theme.colors.yellow },
              { label: 'Fejlesztendő', range: '0 – 54%', color: theme.colors.error },
            ].map((s) => (
              <View
                key={s.label}
                style={[styles.scaleRow, resultData.rating === s.label && styles.scaleRowActive]}
              >
                <View style={[styles.scaleDot, { backgroundColor: s.color }]} />
                <Text style={styles.scaleLabel}>{s.label}</Text>
                <Text style={styles.scaleRange}>{s.range}</Text>
              </View>
            ))}
          </View>

          <View style={styles.resultActions}>
            <Button title="Újra" onPress={startTest} />
            <Button title="Vissza" onPress={() => setGameState('menu')} variant="outline" />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── PLAYING ──────────────────────────────────────────────────────
  const currentStimulus = sequence[currentIndex];
  const progress = sequence.length > 0 ? (currentIndex + 1) / sequence.length : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with targets and progress */}
      <View style={styles.playHeader}>
        <View style={styles.playHeaderTop}>
          <View style={styles.timerBadge}>
            <Ionicons name="time-outline" size={16} color={theme.colors.navy} />
            <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
          </View>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {sequence.length}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>

        {/* Target reference */}
        <View style={styles.targetRow}>
          <Text style={styles.targetHint}>Célok:</Text>
          {targets.map((sym, i) => (
            <View key={i} style={styles.targetMiniBox}>
              <Text style={styles.targetMiniText}>{sym}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Central stimulus area */}
      <View style={styles.stimulusArea}>
        {currentStimulus && (
          <View
            style={[
              styles.stimulusCard,
              responded && currentStimulus.isTarget && styles.stimulusCardHit,
              responded && !currentStimulus.isTarget && styles.stimulusCardFalse,
            ]}
          >
            <Text
              style={[
                styles.stimulusSymbol,
                responded && styles.stimulusSymbolResponded,
              ]}
            >
              {currentStimulus.symbol}
            </Text>
          </View>
        )}

        {responded && (
          <Text
            style={[
              styles.feedbackText,
              { color: currentStimulus?.isTarget ? theme.colors.success : theme.colors.error },
            ]}
          >
            {currentStimulus?.isTarget ? 'Találat!' : 'Téves!'}
          </Text>
        )}
      </View>

      {/* Bottom action area */}
      <View style={styles.actionArea}>
        <TouchableOpacity
          style={[styles.markButton, responded && styles.markButtonDisabled]}
          onPress={handleTap}
          disabled={responded}
          activeOpacity={0.7}
        >
          <Ionicons
            name="hand-left"
            size={28}
            color={theme.colors.white}
            style={{ marginRight: theme.spacing.sm }}
          />
          <Text style={styles.markButtonText}>JELÖLÉS</Text>
        </TouchableOpacity>
        <Text style={styles.actionHint}>
          Koppints, ha a szimbólum megegyezik valamelyik céllal
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  // ── Menu ──────────────────────────────────────────────────────
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    gap: theme.spacing.md,
  },
  backBtn: { padding: theme.spacing.xs },
  menuTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: '800',
    color: theme.colors.navy,
  },
  menuContent: { alignItems: 'center', padding: theme.spacing.xl },
  menuIcon: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.navy + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  menuMainTitle: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: '800',
    color: theme.colors.navy,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  menuDesc: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  targetPreview: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    width: '100%',
    ...theme.shadows.sm,
    marginBottom: theme.spacing.md,
  },
  targetPreviewTitle: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '700',
    color: theme.colors.darkGray,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  targetSymbols: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  targetSymbolBox: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary + '10',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetSymbolText: {
    fontSize: 24,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  rulesCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    width: '100%',
    ...theme.shadows.sm,
    gap: theme.spacing.sm,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  ruleText: { fontSize: theme.fontSizes.sm, color: theme.colors.darkGray },
  menuInfo: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: '700',
    marginTop: theme.spacing.lg,
  },

  // ── Playing ───────────────────────────────────────────────────
  playHeader: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  playHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '800',
    color: theme.colors.navy,
  },
  progressText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '700',
    color: theme.colors.gray,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: theme.colors.lightGray,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  targetHint: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.gray,
    fontWeight: '600',
  },
  targetMiniBox: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary + '10',
  },
  targetMiniText: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: '700',
  },

  // Stimulus area
  stimulusArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  stimulusCard: {
    width: 160,
    height: 160,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
    borderWidth: 3,
    borderColor: theme.colors.lightGray,
  },
  stimulusCardHit: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.success + '10',
  },
  stimulusCardFalse: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.error + '10',
  },
  stimulusSymbol: {
    fontSize: 72,
    color: theme.colors.black,
  },
  stimulusSymbolResponded: {
    opacity: 0.6,
  },
  feedbackText: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '800',
    marginTop: theme.spacing.md,
  },

  // Action area
  actionArea: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    alignItems: 'center',
  },
  markButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    width: '100%',
    minHeight: 64,
    ...theme.shadows.md,
  },
  markButtonDisabled: {
    opacity: 0.4,
  },
  markButtonText: {
    fontSize: theme.fontSizes.xl,
    fontWeight: '900',
    color: theme.colors.white,
    letterSpacing: 1,
  },
  actionHint: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },

  // ── Result ────────────────────────────────────────────────────
  resultContainer: { padding: theme.spacing.lg, alignItems: 'center' },
  resultMainTitle: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: '800',
    color: theme.colors.navy,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  resultCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  resultScore: {
    fontSize: 38,
    fontWeight: '900',
    color: theme.colors.white,
  },
  resultLabel: {
    fontSize: theme.fontSizes.xs,
    color: 'rgba(255,255,255,0.8)',
  },
  ratingBadge: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xl,
  },
  ratingText: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  statBox: {
    width: '47%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.sm,
    flexGrow: 1,
  },
  statValue: {
    fontSize: theme.fontSizes.xl,
    fontWeight: '800',
    color: theme.colors.black,
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.gray,
    marginTop: 2,
  },
  scaleCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    width: '100%',
    ...theme.shadows.sm,
  },
  scaleTitle: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '700',
    color: theme.colors.darkGray,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  scaleRowActive: { backgroundColor: theme.colors.background },
  scaleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: theme.spacing.sm,
  },
  scaleLabel: {
    flex: 1,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.darkGray,
    fontWeight: '600',
  },
  scaleRange: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.mediumGray,
  },
  resultActions: {
    width: '100%',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xl,
  },
});
