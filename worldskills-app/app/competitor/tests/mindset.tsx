import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../lib/auth-context';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/Button';
import { theme } from '../../../lib/theme';

type GameState = 'menu' | 'playing' | 'result';

interface MindsetQuestion {
  id: number;
  text: string;
  category: 'intelligence' | 'talent' | 'personality';
  isGrowth: boolean; // true = growth mindset statement, false = fixed mindset
}

const LIKERT_OPTIONS = [
  { label: 'Teljesen egyetértek', value: 6 },
  { label: 'Egyetértek', value: 5 },
  { label: 'Általában egyetértek', value: 4 },
  { label: 'Általában nem értek egyet', value: 3 },
  { label: 'Nem értek egyet', value: 2 },
  { label: 'Egyáltalán nem értek egyet', value: 1 },
];

const MINDSET_QUESTIONS: MindsetQuestion[] = [
  { id: 1, text: 'Intelligenciánkon nem változtathatunk.', category: 'intelligence', isGrowth: false },
  { id: 2, text: 'Mindig változtathatunk az intelligenciánkon.', category: 'intelligence', isGrowth: true },
  { id: 3, text: 'Tanulhatunk új dolgokat, de intelligenciánkat alapvetően nem változtathatjuk meg.', category: 'intelligence', isGrowth: false },
  { id: 4, text: 'Nem számít, mennyire születünk intelligensnek, hiszen ezen mindig változtathatunk.', category: 'intelligence', isGrowth: true },
  { id: 5, text: 'Szakmai tehetségünk mértékén nem változtathatunk.', category: 'talent', isGrowth: false },
  { id: 6, text: 'Bármikor változtathatunk azon, hogy mennyire vagyunk jó szakemberek.', category: 'talent', isGrowth: true },
  { id: 7, text: 'Tanulhatunk új dolgokat, de alapvető szakmai tehetségünkön nem változtathatunk.', category: 'talent', isGrowth: false },
  { id: 8, text: 'Nem számít, mennyire születünk tehetségesnek, hiszen képességünket bármikor fejleszthetjük.', category: 'talent', isGrowth: true },
  { id: 9, text: 'Adott jellemzőkkel rendelkező ember vagyok, aki nem változik.', category: 'personality', isGrowth: false },
  { id: 10, text: 'Nem számít, milyennek születtünk, mert bármikor megváltozhatunk.', category: 'personality', isGrowth: true },
  { id: 11, text: 'Változtathatunk néhány vonásunkon, de legfontosabb jellemzőink nem változnak.', category: 'personality', isGrowth: false },
  { id: 12, text: 'Még legfontosabb jellemzőinket is képesek lehetünk megváltoztatni.', category: 'personality', isGrowth: true },
];

interface Answer {
  questionId: number;
  value: number;
}

export default function MindsetScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [gameState, setGameState] = useState<GameState>('menu');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [results, setResults] = useState<{
    overall: number;
    intelligence: number;
    talent: number;
    personality: number;
    interpretation: string;
  } | null>(null);

  function startTest() {
    setGameState('playing');
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedValue(null);
    setResults(null);
  }

  function handleNext() {
    if (selectedValue === null) return;

    const newAnswers = [...answers, {
      questionId: MINDSET_QUESTIONS[currentQuestion].id,
      value: selectedValue,
    }];
    setAnswers(newAnswers);

    const next = currentQuestion + 1;
    if (next >= MINDSET_QUESTIONS.length) {
      calculateResults(newAnswers);
    } else {
      setCurrentQuestion(next);
      setSelectedValue(null);
    }
  }

  function calculateResults(allAnswers: Answer[]) {
    // Score calculation:
    // Growth mindset questions: higher agreement = higher growth score
    // Fixed mindset questions: higher agreement = lower growth score (reverse scored)
    function getScore(questionId: number, value: number): number {
      const q = MINDSET_QUESTIONS.find((q) => q.id === questionId)!;
      return q.isGrowth ? value : 7 - value; // Reverse score for fixed mindset items
    }

    function categoryScore(category: string): number {
      const categoryAnswers = allAnswers.filter((a) => {
        const q = MINDSET_QUESTIONS.find((q) => q.id === a.questionId)!;
        return q.category === category;
      });
      const total = categoryAnswers.reduce((sum, a) => sum + getScore(a.questionId, a.value), 0);
      return Math.round((total / (categoryAnswers.length * 6)) * 100);
    }

    const overallTotal = allAnswers.reduce((sum, a) => sum + getScore(a.questionId, a.value), 0);
    const overallPct = Math.round((overallTotal / (allAnswers.length * 6)) * 100);

    const intelligencePct = categoryScore('intelligence');
    const talentPct = categoryScore('talent');
    const personalityPct = categoryScore('personality');

    let interpretation = '';
    if (overallPct >= 80) {
      interpretation = 'Erős fejlődési szemléletmóddal rendelkezel! Hiszel abban, hogy képességeid fejleszthetők, és a kihívásokat lehetőségként éled meg.';
    } else if (overallPct >= 60) {
      interpretation = 'Többnyire fejlődési szemléletmóddal rendelkezel, de egyes területeken még rögzült nézetek is jellemzőek rád.';
    } else if (overallPct >= 40) {
      interpretation = 'Vegyes szemléletmóddal rendelkezel. Egyes területeken nyitott vagy a fejlődésre, máshol inkább rögzült nézeteket vallasz.';
    } else {
      interpretation = 'Inkább rögzült szemléletmód jellemez. A versenyfelkészülés során érdemes dolgozni a fejlődési szemlélet erősítésén.';
    }

    const resultData = {
      overall: overallPct,
      intelligence: intelligencePct,
      talent: talentPct,
      personality: personalityPct,
      interpretation,
    };

    setResults(resultData);
    setGameState('result');

    // Save to Supabase
    if (session?.user) {
      supabase.from('test_results').insert({
        user_id: session.user.id,
        test_id: null,
        score: overallTotal,
        max_score: allAnswers.length * 6,
        percentage: overallPct,
        time_taken_seconds: null,
        answers: allAnswers,
      });
    }
  }

  if (gameState === 'menu') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.menuHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.black} />
          </TouchableOpacity>
          <Text style={styles.menuTitle}>Szemléletmód</Text>
        </View>

        <ScrollView contentContainerStyle={styles.menuContent}>
          <View style={styles.menuIcon}>
            <Ionicons name="analytics-outline" size={64} color={theme.colors.purple} />
          </View>
          <Text style={styles.menuMainTitle}>Growth Mindset Teszt</Text>
          <Text style={styles.menuDesc}>
            Ez a kérdőív a szemléletmódodat méri fel három területen: intelligencia, szakmai tehetség és személyiség.
          </Text>
          <Text style={styles.menuDesc}>
            Nincsenek jó vagy rossz válaszok - válaszolj őszintén!
          </Text>

          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <Ionicons name="bulb-outline" size={20} color={theme.colors.teal} />
              <Text style={styles.infoCardText}>Intelligencia</Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="hammer-outline" size={20} color={theme.colors.orange} />
              <Text style={styles.infoCardText}>Szakmai tehetség</Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="person-outline" size={20} color={theme.colors.magenta} />
              <Text style={styles.infoCardText}>Személyiség</Text>
            </View>
          </View>

          <Text style={styles.menuInfo}>12 kérdés • ~3 perc</Text>
          <Button title="Teszt indítása" onPress={startTest} style={{ marginTop: theme.spacing.lg }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (gameState === 'result' && results) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <Text style={styles.resultMainTitle}>Eredményed</Text>

          {/* Overall score circle */}
          <View style={styles.resultCircle}>
            <Text style={styles.resultScore}>{results.overall}%</Text>
            <Text style={styles.resultLabel}>Growth Mindset</Text>
          </View>

          {/* Interpretation */}
          <View style={styles.interpretationCard}>
            <Text style={styles.interpretationText}>{results.interpretation}</Text>
          </View>

          {/* Category breakdown */}
          <Text style={styles.breakdownTitle}>Részletes eredmény</Text>

          <View style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <Ionicons name="bulb-outline" size={20} color={theme.colors.teal} />
              <Text style={styles.categoryName}>Intelligencia</Text>
              <Text style={styles.categoryScore}>{results.intelligence}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${results.intelligence}%`, backgroundColor: theme.colors.teal }]} />
            </View>
          </View>

          <View style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <Ionicons name="hammer-outline" size={20} color={theme.colors.orange} />
              <Text style={styles.categoryName}>Szakmai tehetség</Text>
              <Text style={styles.categoryScore}>{results.talent}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${results.talent}%`, backgroundColor: theme.colors.orange }]} />
            </View>
          </View>

          <View style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <Ionicons name="person-outline" size={20} color={theme.colors.magenta} />
              <Text style={styles.categoryName}>Személyiség</Text>
              <Text style={styles.categoryScore}>{results.personality}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${results.personality}%`, backgroundColor: theme.colors.magenta }]} />
            </View>
          </View>

          {/* Scale explanation */}
          <View style={styles.scaleExplanation}>
            <Text style={styles.scaleTitle}>Skála</Text>
            <View style={styles.scaleRow}>
              <View style={[styles.scaleDot, { backgroundColor: theme.colors.error }]} />
              <Text style={styles.scaleText}>0-40%: Rögzült szemléletmód</Text>
            </View>
            <View style={styles.scaleRow}>
              <View style={[styles.scaleDot, { backgroundColor: theme.colors.yellow }]} />
              <Text style={styles.scaleText}>40-60%: Vegyes szemléletmód</Text>
            </View>
            <View style={styles.scaleRow}>
              <View style={[styles.scaleDot, { backgroundColor: theme.colors.teal }]} />
              <Text style={styles.scaleText}>60-80%: Fejlődési szemlélet</Text>
            </View>
            <View style={styles.scaleRow}>
              <View style={[styles.scaleDot, { backgroundColor: theme.colors.success }]} />
              <Text style={styles.scaleText}>80-100%: Erős fejlődési szemlélet</Text>
            </View>
          </View>

          <View style={styles.resultActions}>
            <Button title="Újra kitöltés" onPress={startTest} />
            <Button title="Vissza" onPress={() => setGameState('menu')} variant="outline" />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // PLAYING
  const q = MINDSET_QUESTIONS[currentQuestion];
  const categoryColors = {
    intelligence: theme.colors.teal,
    talent: theme.colors.orange,
    personality: theme.colors.magenta,
  };
  const categoryLabels = {
    intelligence: 'Intelligencia',
    talent: 'Szakmai tehetség',
    personality: 'Személyiség',
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / MINDSET_QUESTIONS.length) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.questionContainer}>
        <View style={styles.questionMeta}>
          <Text style={styles.questionCount}>
            {currentQuestion + 1}/{MINDSET_QUESTIONS.length}
          </Text>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColors[q.category] + '20' }]}>
            <Text style={[styles.categoryBadgeText, { color: categoryColors[q.category] }]}>
              {categoryLabels[q.category]}
            </Text>
          </View>
        </View>

        <Text style={styles.questionText}>{q.text}</Text>

        <View style={styles.likertOptions}>
          {LIKERT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.likertOption,
                selectedValue === opt.value && styles.likertOptionSelected,
              ]}
              onPress={() => setSelectedValue(opt.value)}
            >
              <View style={[
                styles.likertRadio,
                selectedValue === opt.value && styles.likertRadioSelected,
              ]}>
                {selectedValue === opt.value && <View style={styles.likertRadioDot} />}
              </View>
              <Text style={[
                styles.likertLabel,
                selectedValue === opt.value && styles.likertLabelSelected,
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title={currentQuestion < MINDSET_QUESTIONS.length - 1 ? 'Következő' : 'Eredmény'}
          onPress={handleNext}
          disabled={selectedValue === null}
          style={{ marginTop: theme.spacing.lg }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  // Menu
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
    color: theme.colors.black,
  },
  menuContent: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  menuIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.purple + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  menuMainTitle: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: '800',
    color: theme.colors.black,
    marginBottom: theme.spacing.md,
  },
  menuDesc: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.sm,
  },
  infoCards: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.sm,
  },
  infoCardText: {
    fontSize: theme.fontSizes.xs,
    fontWeight: '600',
    color: theme.colors.darkGray,
  },
  menuInfo: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: '700',
    marginTop: theme.spacing.lg,
  },
  // Progress
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.lightGray,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  // Question
  questionContainer: {
    padding: theme.spacing.lg,
  },
  questionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  questionCount: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.mediumGray,
    fontWeight: '600',
  },
  categoryBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  categoryBadgeText: {
    fontSize: theme.fontSizes.xs,
    fontWeight: '700',
  },
  questionText: {
    fontSize: theme.fontSizes.xl,
    fontWeight: '700',
    color: theme.colors.black,
    lineHeight: 32,
    marginBottom: theme.spacing.xl,
  },
  // Likert scale
  likertOptions: {
    gap: theme.spacing.sm,
  },
  likertOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.cardBorder,
  },
  likertOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '08',
  },
  likertRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.mediumGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  likertRadioSelected: {
    borderColor: theme.colors.primary,
  },
  likertRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  likertLabel: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.darkGray,
    flex: 1,
  },
  likertLabelSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  // Result
  resultContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  resultMainTitle: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: '800',
    color: theme.colors.black,
    marginBottom: theme.spacing.lg,
  },
  resultCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  resultScore: {
    fontSize: 42,
    fontWeight: '900',
    color: theme.colors.white,
  },
  resultLabel: {
    fontSize: theme.fontSizes.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  interpretationCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    width: '100%',
    ...theme.shadows.sm,
  },
  interpretationText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.darkGray,
    lineHeight: 24,
  },
  breakdownTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '700',
    color: theme.colors.black,
    marginBottom: theme.spacing.md,
    alignSelf: 'flex-start',
  },
  categoryCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    width: '100%',
    ...theme.shadows.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  categoryName: {
    flex: 1,
    fontSize: theme.fontSizes.md,
    fontWeight: '600',
    color: theme.colors.black,
    marginLeft: theme.spacing.sm,
  },
  categoryScore: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '800',
    color: theme.colors.black,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  scaleExplanation: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
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
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  scaleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  scaleText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.gray,
  },
  resultActions: {
    width: '100%',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xl,
  },
});
