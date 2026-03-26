import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../lib/auth-context';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/Button';
import { theme } from '../../../lib/theme';

type GameState = 'menu' | 'playing' | 'result';

// Symbol-based attention test inspired by the d2 test / Bourdon-test
// Target: find symbols that match one of 4 target patterns among distractors
// Adapted from the paper-based "400 elem, 5 perc" test

const SYMBOLS = ['◆', '●', '■', '▲', '★', '◇', '○', '□', '△', '☆'];
const DECORATORS = ['', '·', ':', '˙', '‥']; // dots above/below to create variants

interface GridItem {
  id: number;
  symbol: string;
  decorator: string;
  isTarget: boolean;
  tapped: boolean;
}

function generateGrid(size: number, targetRatio: number = 0.25): { items: GridItem[]; targets: string[] } {
  // Pick 2 target symbols with specific decorators
  const targetCombos = [
    { symbol: SYMBOLS[0], decorator: DECORATORS[1] },
    { symbol: SYMBOLS[0], decorator: DECORATORS[2] },
    { symbol: SYMBOLS[1], decorator: DECORATORS[1] },
    { symbol: SYMBOLS[1], decorator: DECORATORS[2] },
  ];

  const targets = targetCombos.map((t) => `${t.decorator}${t.symbol}${t.decorator}`);

  const items: GridItem[] = [];
  for (let i = 0; i < size; i++) {
    const isTarget = Math.random() < targetRatio;

    if (isTarget) {
      const combo = targetCombos[Math.floor(Math.random() * targetCombos.length)];
      items.push({
        id: i,
        symbol: combo.symbol,
        decorator: combo.decorator,
        isTarget: true,
        tapped: false,
      });
    } else {
      // Generate a distractor that is NOT a target
      let sym: string;
      let dec: string;
      do {
        sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        dec = DECORATORS[Math.floor(Math.random() * DECORATORS.length)];
      } while (targetCombos.some((t) => t.symbol === sym && t.decorator === dec));

      items.push({
        id: i,
        symbol: sym,
        decorator: dec,
        isTarget: false,
        tapped: false,
      });
    }
  }

  return { items, targets };
}

export default function AttentionScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [gameState, setGameState] = useState<GameState>('menu');
  const [grid, setGrid] = useState<GridItem[]>([]);
  const [targets, setTargets] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [timerActive, setTimerActive] = useState(false);
  const [results, setResults] = useState<{
    correct: number;
    missed: number;
    wrong: number;
    total: number;
    totalTargets: number;
    tPercent: number;
    rating: string;
  } | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Timer
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setTimerActive(false);
          finishTest();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerActive]);

  function startTest() {
    const { items, targets: tgts } = generateGrid(400, 0.25);
    setGrid(items);
    setTargets(tgts);
    setTimeLeft(300);
    setTimerActive(true);
    setGameState('playing');
    setResults(null);
  }

  function handleTap(itemId: number) {
    setGrid((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, tapped: !item.tapped } : item
      )
    );
  }

  function finishTest() {
    setTimerActive(false);

    const correct = grid.filter((i) => i.isTarget && i.tapped).length;
    const missed = grid.filter((i) => i.isTarget && !i.tapped).length;
    const wrong = grid.filter((i) => !i.isTarget && i.tapped).length;
    const totalTargets = grid.filter((i) => i.isTarget).length;
    const totalReviewed = grid.length; // In mobile we show all at once

    // T% = (correct - wrong) / totalTargets * 100
    const tPercent = Math.max(0, Math.round(((correct - wrong) / totalTargets) * 100));

    // Rating based on the answer key table
    let rating = '';
    if (tPercent >= 99.7) rating = 'Kiváló';
    else if (tPercent >= 98.9) rating = 'Jó';
    else if (tPercent >= 97.1) rating = 'Közepes';
    else if (tPercent >= 93.6) rating = 'Elégséges';
    else rating = 'Fejlesztendő';

    const resultData = {
      correct,
      missed,
      wrong,
      total: totalReviewed,
      totalTargets,
      tPercent,
      rating,
    };
    setResults(resultData);
    setGameState('result');

    if (session?.user) {
      supabase.from('test_results').insert({
        user_id: session.user.id,
        test_id: null,
        score: correct,
        max_score: totalTargets,
        percentage: tPercent,
        time_taken_seconds: 300 - timeLeft,
        answers: resultData,
      });
    }
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

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
            <Ionicons name="scan-outline" size={64} color={theme.colors.teal} />
          </View>
          <Text style={styles.menuMainTitle}>Bourdon-teszt (digitális)</Text>
          <Text style={styles.menuDesc}>
            400 szimbólum jelenik meg a képernyőn. Keresd meg és koppints az összes
            célszimbólumra 5 percen belül!
          </Text>

          <View style={styles.targetPreview}>
            <Text style={styles.targetPreviewTitle}>Ezeket keresd:</Text>
            <View style={styles.targetSymbols}>
              <View style={styles.targetSymbolBox}>
                <Text style={styles.targetSymbolText}>·◆·</Text>
              </View>
              <View style={styles.targetSymbolBox}>
                <Text style={styles.targetSymbolText}>:◆:</Text>
              </View>
              <View style={styles.targetSymbolBox}>
                <Text style={styles.targetSymbolText}>·●·</Text>
              </View>
              <View style={styles.targetSymbolBox}>
                <Text style={styles.targetSymbolText}>:●:</Text>
              </View>
            </View>
          </View>

          <View style={styles.rulesCard}>
            <View style={styles.ruleRow}>
              <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
              <Text style={styles.ruleText}>Koppints a célszimbólumokra</Text>
            </View>
            <View style={styles.ruleRow}>
              <Ionicons name="close-circle" size={18} color={theme.colors.error} />
              <Text style={styles.ruleText}>Ne koppints a hasonló, de eltérő jelekre</Text>
            </View>
            <View style={styles.ruleRow}>
              <Ionicons name="time" size={18} color={theme.colors.orange} />
              <Text style={styles.ruleText}>5 perced van az összesre</Text>
            </View>
          </View>

          <Text style={styles.menuInfo}>400 elem • 5 perc</Text>
          <Button title="Teszt indítása" onPress={startTest} style={{ marginTop: theme.spacing.lg }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (gameState === 'result' && results) {
    const ratingColors: Record<string, string> = {
      'Kiváló': theme.colors.success,
      'Jó': theme.colors.teal,
      'Közepes': theme.colors.orange,
      'Elégséges': theme.colors.yellow,
      'Fejlesztendő': theme.colors.error,
    };

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <Text style={styles.resultMainTitle}>Figyelem Teszt Eredmény</Text>

          <View style={[styles.resultCircle, { backgroundColor: ratingColors[results.rating] || theme.colors.primary }]}>
            <Text style={styles.resultScore}>{results.tPercent}%</Text>
            <Text style={styles.resultLabel}>T%</Text>
          </View>

          <View style={[styles.ratingBadge, { backgroundColor: (ratingColors[results.rating] || theme.colors.primary) + '20' }]}>
            <Text style={[styles.ratingText, { color: ratingColors[results.rating] || theme.colors.primary }]}>
              {results.rating}
            </Text>
          </View>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
              <Text style={styles.statValue}>{results.correct}</Text>
              <Text style={styles.statLabel}>Helyes</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="alert-circle" size={24} color={theme.colors.orange} />
              <Text style={styles.statValue}>{results.missed}</Text>
              <Text style={styles.statLabel}>Kihagyott</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="close-circle" size={24} color={theme.colors.error} />
              <Text style={styles.statValue}>{results.wrong}</Text>
              <Text style={styles.statLabel}>Téves</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="apps" size={24} color={theme.colors.primary} />
              <Text style={styles.statValue}>{results.totalTargets}</Text>
              <Text style={styles.statLabel}>Célok össz.</Text>
            </View>
          </View>

          {/* Rating scale */}
          <View style={styles.scaleCard}>
            <Text style={styles.scaleTitle}>Értékelési skála (T%)</Text>
            {[
              { label: 'Kiváló', range: '99.7 – 100%', color: theme.colors.success },
              { label: 'Jó', range: '98.9 – 99.6%', color: theme.colors.teal },
              { label: 'Közepes', range: '97.1 – 98.8%', color: theme.colors.orange },
              { label: 'Elégséges', range: '93.6 – 97.0%', color: theme.colors.yellow },
              { label: 'Fejlesztendő', range: '0 – 93.5%', color: theme.colors.error },
            ].map((s) => (
              <View key={s.label} style={[styles.scaleRow, results.rating === s.label && styles.scaleRowActive]}>
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

  // PLAYING
  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed header with timer and targets */}
      <View style={styles.playHeader}>
        <View style={styles.playHeaderTop}>
          <View style={[styles.timerBadge, timeLeft <= 30 && styles.timerBadgeUrgent]}>
            <Ionicons name="time-outline" size={16} color={timeLeft <= 30 ? theme.colors.white : theme.colors.primary} />
            <Text style={[styles.timerText, timeLeft <= 30 && styles.timerTextUrgent]}>
              {formatTime(timeLeft)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.finishBtn}
            onPress={() => {
              Alert.alert('Befejezés', 'Biztosan befejezed a tesztet?', [
                { text: 'Mégsem', style: 'cancel' },
                { text: 'Befejezés', onPress: finishTest },
              ]);
            }}
          >
            <Text style={styles.finishBtnText}>Befejezés</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.targetRow}>
          <Text style={styles.targetHint}>Keresd:</Text>
          {['·◆·', ':◆:', '·●·', ':●:'].map((t, i) => (
            <View key={i} style={styles.targetMiniBox}>
              <Text style={styles.targetMiniText}>{t}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Grid */}
      <ScrollView ref={scrollRef} contentContainerStyle={styles.gridContainer}>
        <View style={styles.grid}>
          {grid.map((item) => {
            const display = `${item.decorator}${item.symbol}${item.decorator}`;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.gridCell,
                  item.tapped && styles.gridCellTapped,
                ]}
                onPress={() => handleTap(item.id)}
                activeOpacity={0.6}
              >
                <Text style={[
                  styles.gridCellText,
                  item.tapped && styles.gridCellTextTapped,
                ]}>
                  {display}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  // Menu
  menuHeader: {
    flexDirection: 'row', alignItems: 'center', padding: theme.spacing.md,
    backgroundColor: theme.colors.white, gap: theme.spacing.md,
  },
  backBtn: { padding: theme.spacing.xs },
  menuTitle: { fontSize: theme.fontSizes.xl, fontWeight: '800', color: theme.colors.black },
  menuContent: { alignItems: 'center', padding: theme.spacing.xl },
  menuIcon: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: theme.colors.teal + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.lg,
  },
  menuMainTitle: {
    fontSize: theme.fontSizes.xxl, fontWeight: '800', color: theme.colors.black,
    marginBottom: theme.spacing.md, textAlign: 'center',
  },
  menuDesc: {
    fontSize: theme.fontSizes.md, color: theme.colors.gray, textAlign: 'center', lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  targetPreview: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md,
    width: '100%', ...theme.shadows.sm, marginBottom: theme.spacing.md,
  },
  targetPreviewTitle: {
    fontSize: theme.fontSizes.sm, fontWeight: '700', color: theme.colors.darkGray,
    marginBottom: theme.spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  targetSymbols: { flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.md },
  targetSymbolBox: {
    width: 56, height: 56, borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary + '10', borderWidth: 2, borderColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  targetSymbolText: { fontSize: 22, color: theme.colors.primary, fontWeight: '700' },
  rulesCard: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md,
    width: '100%', ...theme.shadows.sm, gap: theme.spacing.sm,
  },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  ruleText: { fontSize: theme.fontSizes.sm, color: theme.colors.darkGray },
  menuInfo: { fontSize: theme.fontSizes.sm, color: theme.colors.primary, fontWeight: '700', marginTop: theme.spacing.lg },
  // Playing
  playHeader: {
    backgroundColor: theme.colors.white, paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.lightGray,
  },
  playHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm },
  timerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: theme.colors.primary + '10', paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs, borderRadius: theme.borderRadius.full,
  },
  timerBadgeUrgent: { backgroundColor: theme.colors.error },
  timerText: { fontSize: theme.fontSizes.lg, fontWeight: '800', color: theme.colors.primary },
  timerTextUrgent: { color: theme.colors.white },
  finishBtn: {
    backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs, borderRadius: theme.borderRadius.full,
  },
  finishBtnText: { color: theme.colors.white, fontSize: theme.fontSizes.sm, fontWeight: '700' },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  targetHint: { fontSize: theme.fontSizes.xs, color: theme.colors.gray, fontWeight: '600' },
  targetMiniBox: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    backgroundColor: theme.colors.primary + '10',
  },
  targetMiniText: { fontSize: 14, color: theme.colors.primary, fontWeight: '700' },
  // Grid
  gridContainer: { padding: theme.spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  gridCell: {
    width: 38, height: 38, margin: 1, borderRadius: 4,
    backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.colors.cardBorder,
  },
  gridCellTapped: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  gridCellText: { fontSize: 13, color: theme.colors.black },
  gridCellTextTapped: { color: theme.colors.white },
  // Result
  resultContainer: { padding: theme.spacing.lg, alignItems: 'center' },
  resultMainTitle: { fontSize: theme.fontSizes.xxl, fontWeight: '800', color: theme.colors.black, marginBottom: theme.spacing.lg },
  resultCircle: {
    width: 130, height: 130, borderRadius: 65, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md,
  },
  resultScore: { fontSize: 38, fontWeight: '900', color: theme.colors.white },
  resultLabel: { fontSize: theme.fontSizes.xs, color: 'rgba(255,255,255,0.8)' },
  ratingBadge: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm, borderRadius: theme.borderRadius.full, marginBottom: theme.spacing.xl },
  ratingText: { fontSize: theme.fontSizes.lg, fontWeight: '800' },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, width: '100%', marginBottom: theme.spacing.lg,
  },
  statBox: {
    width: '47%', backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, alignItems: 'center', ...theme.shadows.sm, flexGrow: 1,
  },
  statValue: { fontSize: theme.fontSizes.xl, fontWeight: '800', color: theme.colors.black, marginTop: theme.spacing.xs },
  statLabel: { fontSize: theme.fontSizes.xs, color: theme.colors.gray, marginTop: 2 },
  scaleCard: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md,
    width: '100%', ...theme.shadows.sm,
  },
  scaleTitle: {
    fontSize: theme.fontSizes.sm, fontWeight: '700', color: theme.colors.darkGray, marginBottom: theme.spacing.sm,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  scaleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: theme.spacing.sm, borderRadius: 6 },
  scaleRowActive: { backgroundColor: theme.colors.background },
  scaleDot: { width: 10, height: 10, borderRadius: 5, marginRight: theme.spacing.sm },
  scaleLabel: { flex: 1, fontSize: theme.fontSizes.sm, color: theme.colors.darkGray, fontWeight: '600' },
  scaleRange: { fontSize: theme.fontSizes.xs, color: theme.colors.mediumGray },
  resultActions: { width: '100%', gap: theme.spacing.sm, marginTop: theme.spacing.xl },
});
