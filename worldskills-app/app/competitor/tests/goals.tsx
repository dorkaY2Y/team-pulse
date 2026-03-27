import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { saveResult } from '../../../lib/results';
import { Button } from '../../../components/Button';
import { theme } from '../../../lib/theme';

type GameState = 'menu' | 'playing' | 'result';

const LIKERT_OPTIONS = [
  { label: 'Teljesen egyetértek', value: 5 },
  { label: 'Inkább egyetértek', value: 4 },
  { label: 'Igaz is, nem is', value: 3 },
  { label: 'Inkább nem értek egyet', value: 2 },
  { label: 'Egyáltalán nem értek egyet', value: 1 },
];

interface GoalQuestion {
  id: number;
  text: string;
  type: 'comparative' | 'mastery'; // viszonyító vs elsajátítási
}

const GOAL_QUESTIONS: GoalQuestion[] = [
  { id: 1, text: 'Egyedül csak én tudom elvégezni az adott gyakorlatot.', type: 'comparative' },
  { id: 2, text: 'Megtanulok valamit, ami még több gyakorlásra késztet.', type: 'mastery' },
  { id: 3, text: 'Jobb vagyok a társaimnál.', type: 'comparative' },
  { id: 4, text: 'A többiek nem képesek olyan jól teljesíteni, mint én.', type: 'comparative' },
  { id: 5, text: 'Olyasmit tanulok, amit élvezet elsajátítani.', type: 'mastery' },
  { id: 6, text: 'A többiek hibáznak, én nem.', type: 'comparative' },
  { id: 7, text: 'Kemény munkával tanulok meg valami újat a szakmámban.', type: 'mastery' },
  { id: 8, text: 'Keményen felkészültem.', type: 'mastery' },
  { id: 9, text: 'Én szerzem a legtöbb pontot.', type: 'comparative' },
  { id: 10, text: 'Én vagyok a legjobb.', type: 'comparative' },
  { id: 11, text: 'Jól ráérzek mindarra, amit tanulok.', type: 'mastery' },
  { id: 12, text: 'A legjobbat hozom ki magamból.', type: 'mastery' },
];

interface Answer {
  questionId: number;
  value: number;
}

export default function GoalsScreen() {
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState>('menu');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [results, setResults] = useState<{
    comparative: number;
    mastery: number;
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
      questionId: GOAL_QUESTIONS[currentQuestion].id,
      value: selectedValue,
    }];
    setAnswers(newAnswers);

    const next = currentQuestion + 1;
    if (next >= GOAL_QUESTIONS.length) {
      calculateResults(newAnswers);
    } else {
      setCurrentQuestion(next);
      setSelectedValue(null);
    }
  }

  function calculateResults(allAnswers: Answer[]) {
    const comparativeIds = [1, 3, 4, 6, 9, 10];
    const masteryIds = [2, 5, 7, 8, 11, 12];

    const comparativeSum = allAnswers
      .filter((a) => comparativeIds.includes(a.questionId))
      .reduce((sum, a) => sum + a.value, 0);
    const masterySum = allAnswers
      .filter((a) => masteryIds.includes(a.questionId))
      .reduce((sum, a) => sum + a.value, 0);

    const comparativeAvg = Math.round((comparativeSum / 6) * 10) / 10;
    const masteryAvg = Math.round((masterySum / 6) * 10) / 10;

    let interpretation = '';
    if (masteryAvg > comparativeAvg + 1) {
      interpretation = 'Elsajátítási célorientáció jellemez: a fejlődés és tanulás a legfontosabb motivátorod. Ez ideális a versenyfelkészüléshez!';
    } else if (comparativeAvg > masteryAvg + 1) {
      interpretation = 'Viszonyító célorientáció jellemez: a másoknál jobb teljesítmény a fő hajtóerőd. Próbálj a saját fejlődésedre is fókuszálni!';
    } else {
      interpretation = 'Kiegyensúlyozott célorientációval rendelkezel: mind a fejlődés, mind a versengés motivál. Ez jó kiindulópont!';
    }

    setResults({ comparative: comparativeAvg, mastery: masteryAvg, interpretation });
    setGameState('result');

    const totalScore = comparativeSum + masterySum;
    const maxScore = GOAL_QUESTIONS.length * 5;
    saveResult('goals', 'Célorientáció', totalScore, maxScore, null, {
      comparativeAvg, masteryAvg, answers: allAnswers,
    });
  }

  if (gameState === 'menu') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.menuHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.black} />
          </TouchableOpacity>
          <Text style={styles.menuTitle}>Célorientáció</Text>
        </View>

        <ScrollView contentContainerStyle={styles.menuContent}>
          <View style={styles.menuIcon}>
            <Ionicons name="flag-outline" size={64} color={theme.colors.orange} />
          </View>
          <Text style={styles.menuMainTitle}>Viszonyító és Elsajátítási Célok</Text>
          <Text style={styles.menuDesc}>
            Ez a kérdőív felméri, hogy inkább a másokhoz viszonyított teljesítmény (viszonyítócél)
            vagy a saját fejlődésed (elsajátításicél) motivál.
          </Text>

          <View style={styles.infoCards}>
            <View style={[styles.infoCard, { backgroundColor: theme.colors.orange + '15' }]}>
              <Ionicons name="trophy-outline" size={18} color={theme.colors.orange} />
              <Text style={styles.infoCardText}>Viszonyító cél</Text>
            </View>
            <View style={[styles.infoCard, { backgroundColor: theme.colors.teal + '15' }]}>
              <Ionicons name="trending-up-outline" size={18} color={theme.colors.teal} />
              <Text style={styles.infoCardText}>Elsajátítási cél</Text>
            </View>
          </View>

          <Text style={styles.menuInfo}>12 kérdés • ~3 perc</Text>
          <Button title="Teszt indítása" onPress={startTest} style={{ marginTop: theme.spacing.lg }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (gameState === 'result' && results) {
    const maxVal = Math.max(results.comparative, results.mastery);

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <Text style={styles.resultMainTitle}>Eredményed</Text>

          {/* Two score comparison */}
          <View style={styles.scoresRow}>
            <View style={styles.scoreBox}>
              <View style={[styles.scoreCircle, { backgroundColor: theme.colors.orange }]}>
                <Text style={styles.scoreValue}>{results.comparative}</Text>
              </View>
              <Text style={styles.scoreLabel}>Viszonyító cél</Text>
              <Text style={styles.scoreDesc}>Másokhoz mérés</Text>
            </View>

            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>vs</Text>
            </View>

            <View style={styles.scoreBox}>
              <View style={[styles.scoreCircle, { backgroundColor: theme.colors.teal }]}>
                <Text style={styles.scoreValue}>{results.mastery}</Text>
              </View>
              <Text style={styles.scoreLabel}>Elsajátítási cél</Text>
              <Text style={styles.scoreDesc}>Saját fejlődés</Text>
            </View>
          </View>

          {/* Visual comparison bars */}
          <View style={styles.barSection}>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>Viszonyító</Text>
              <View style={styles.barBg}>
                <View style={[styles.barFill, {
                  width: `${(results.comparative / 5) * 100}%`,
                  backgroundColor: theme.colors.orange,
                }]} />
              </View>
            </View>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>Elsajátítási</Text>
              <View style={styles.barBg}>
                <View style={[styles.barFill, {
                  width: `${(results.mastery / 5) * 100}%`,
                  backgroundColor: theme.colors.teal,
                }]} />
              </View>
            </View>
          </View>

          {/* Interpretation */}
          <View style={styles.interpretationCard}>
            <Text style={styles.interpretationText}>{results.interpretation}</Text>
          </View>

          {/* Scale info */}
          <View style={styles.scaleInfo}>
            <Text style={styles.scaleInfoText}>
              Skála: 1.0 (legalacsonyabb) – 5.0 (legmagasabb)
            </Text>
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
  const q = GOAL_QUESTIONS[currentQuestion];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / GOAL_QUESTIONS.length) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.questionContainer}>
        <Text style={styles.questionCount}>
          {currentQuestion + 1}/{GOAL_QUESTIONS.length}
        </Text>

        <Text style={styles.questionInstruction}>
          Mikor érzed magad a legsikeresebbnek a szakmádban?
        </Text>

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
          title={currentQuestion < GOAL_QUESTIONS.length - 1 ? 'Következő' : 'Eredmény'}
          onPress={handleNext}
          disabled={selectedValue === null}
          style={{ marginTop: theme.spacing.lg }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  menuHeader: {
    flexDirection: 'row', alignItems: 'center', padding: theme.spacing.md,
    backgroundColor: theme.colors.white, gap: theme.spacing.md,
  },
  backBtn: { padding: theme.spacing.xs },
  menuTitle: { fontSize: theme.fontSizes.xl, fontWeight: '800', color: theme.colors.black },
  menuContent: { alignItems: 'center', padding: theme.spacing.xl },
  menuIcon: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: theme.colors.orange + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.lg,
  },
  menuMainTitle: {
    fontSize: theme.fontSizes.xl, fontWeight: '800', color: theme.colors.black,
    marginBottom: theme.spacing.md, textAlign: 'center',
  },
  menuDesc: {
    fontSize: theme.fontSizes.md, color: theme.colors.gray, textAlign: 'center', lineHeight: 24,
  },
  infoCards: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.lg },
  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full, ...theme.shadows.sm,
  },
  infoCardText: { fontSize: theme.fontSizes.xs, fontWeight: '600', color: theme.colors.darkGray },
  menuInfo: { fontSize: theme.fontSizes.sm, color: theme.colors.primary, fontWeight: '700', marginTop: theme.spacing.lg },
  // Progress
  progressBar: { height: 4, backgroundColor: theme.colors.lightGray },
  progressFill: { height: '100%', backgroundColor: theme.colors.primary },
  // Question
  questionContainer: { padding: theme.spacing.lg },
  questionCount: { fontSize: theme.fontSizes.sm, color: theme.colors.mediumGray, fontWeight: '600', marginBottom: theme.spacing.sm },
  questionInstruction: {
    fontSize: theme.fontSizes.sm, color: theme.colors.gray, fontStyle: 'italic', marginBottom: theme.spacing.md,
  },
  questionText: {
    fontSize: theme.fontSizes.xl, fontWeight: '700', color: theme.colors.black, lineHeight: 32, marginBottom: theme.spacing.xl,
  },
  likertOptions: { gap: theme.spacing.sm },
  likertOption: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md, padding: theme.spacing.md, borderWidth: 2, borderColor: theme.colors.cardBorder,
  },
  likertOptionSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '08' },
  likertRadio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: theme.colors.mediumGray,
    alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md,
  },
  likertRadioSelected: { borderColor: theme.colors.primary },
  likertRadioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.colors.primary },
  likertLabel: { fontSize: theme.fontSizes.md, color: theme.colors.darkGray, flex: 1 },
  likertLabelSelected: { color: theme.colors.primary, fontWeight: '600' },
  // Result
  resultContainer: { padding: theme.spacing.lg, alignItems: 'center' },
  resultMainTitle: { fontSize: theme.fontSizes.xxl, fontWeight: '800', color: theme.colors.black, marginBottom: theme.spacing.xl },
  scoresRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xl },
  scoreBox: { flex: 1, alignItems: 'center' },
  scoreCircle: {
    width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.sm,
  },
  scoreValue: { fontSize: 32, fontWeight: '900', color: theme.colors.white },
  scoreLabel: { fontSize: theme.fontSizes.sm, fontWeight: '700', color: theme.colors.black },
  scoreDesc: { fontSize: theme.fontSizes.xs, color: theme.colors.gray },
  vsContainer: { paddingHorizontal: theme.spacing.md },
  vsText: { fontSize: theme.fontSizes.lg, fontWeight: '700', color: theme.colors.mediumGray },
  barSection: { width: '100%', marginBottom: theme.spacing.lg, gap: theme.spacing.sm },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  barLabel: { width: 80, fontSize: theme.fontSizes.xs, color: theme.colors.gray, fontWeight: '600' },
  barBg: { flex: 1, height: 12, backgroundColor: theme.colors.lightGray, borderRadius: 6, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 6 },
  interpretationCard: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg,
    borderLeftWidth: 4, borderLeftColor: theme.colors.primary, width: '100%', ...theme.shadows.sm,
  },
  interpretationText: { fontSize: theme.fontSizes.md, color: theme.colors.darkGray, lineHeight: 24 },
  scaleInfo: { marginTop: theme.spacing.md },
  scaleInfoText: { fontSize: theme.fontSizes.xs, color: theme.colors.mediumGray },
  resultActions: { width: '100%', gap: theme.spacing.sm, marginTop: theme.spacing.xl },
});
