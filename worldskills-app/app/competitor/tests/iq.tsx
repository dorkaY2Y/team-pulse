import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../lib/auth-context';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/Button';
import { theme } from '../../../lib/theme';

type GameState = 'menu' | 'playing' | 'result';

interface IQQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// Built-in IQ questions - will be extended with test bank data
const IQ_QUESTIONS: IQQuestion[] = [
  {
    question: 'Mi a következő szám a sorban?\n2, 6, 18, 54, ?',
    options: ['108', '162', '148', '96'],
    correctIndex: 1,
    explanation: 'Minden szám az előző 3-szorosa: 54 × 3 = 162',
  },
  {
    question: 'Ha A = 1, B = 2, C = 3, ...\nMennyit ér: CAB?',
    options: ['5', '6', '7', '8'],
    correctIndex: 1,
    explanation: 'C=3, A=1, B=2 → 3+1+2 = 6',
  },
  {
    question: 'Melyik NEM illik a sorba?\nAlma, Banán, Répa, Szőlő, Eper',
    options: ['Banán', 'Répa', 'Szőlő', 'Eper'],
    correctIndex: 1,
    explanation: 'A répa zöldség, a többi mind gyümölcs.',
  },
  {
    question: 'Egy óra 3:15-öt mutat. Mekkora a szög a két mutató között?',
    options: ['0°', '7.5°', '15°', '22.5°'],
    correctIndex: 1,
    explanation: '3 órakor a kismutató 90°-nál van. 15 percnél 7.5°-ot halad tovább → 97.5° - 90° = 7.5°',
  },
  {
    question: 'Fejezd be az analógiát:\nKönyv : Olvasás = Kés : ?',
    options: ['Konyha', 'Vágás', 'Éles', 'Evőeszköz'],
    correctIndex: 1,
    explanation: 'A könyv olvasásra való, a kés vágásra.',
  },
  {
    question: 'Mi a következő a mintában?\n🔴🔵🔴🔵🔵🔴🔵🔵🔵🔴?',
    options: ['🔴', '🔵🔵🔵🔵', '🔵🔵', '🔵'],
    correctIndex: 1,
    explanation: 'A kék körök száma nő: 1, 2, 3, tehát a következő 4 kék kör.',
  },
  {
    question: 'Egy apa 4-szer annyi idős, mint a fia.\n20 év múlva kétszer annyi idős lesz.\nHány éves most a fia?',
    options: ['5', '10', '8', '12'],
    correctIndex: 1,
    explanation: 'Fia: x, Apa: 4x. 20 év múlva: 4x+20 = 2(x+20) → 4x+20 = 2x+40 → x = 10',
  },
  {
    question: 'Hány háromszöget látsz?\n△ alakú háromszög 4 belső vonallal felezve',
    options: ['6', '8', '10', '13'],
    correctIndex: 3,
    explanation: 'Egy szabályosan felezett háromszögben 13 háromszög található.',
  },
  {
    question: 'Ha 5 gép 5 perc alatt gyárt 5 terméket,\nhány perc kell 100 gépnek 100 termékhez?',
    options: ['100', '5', '20', '10'],
    correctIndex: 1,
    explanation: '1 gép = 5 perc / 1 termék. 100 gép párhuzamosan 5 perc alatt 100 terméket gyárt.',
  },
  {
    question: 'Melyik szám hiányzik?\n8, 27, 64, 125, ?',
    options: ['150', '196', '216', '250'],
    correctIndex: 2,
    explanation: 'Köbszámok: 2³=8, 3³=27, 4³=64, 5³=125, 6³=216',
  },
];

export default function IQTestScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [gameState, setGameState] = useState<GameState>('menu');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<IQQuestion[]>([]);

  function startTest() {
    const shuffled = [...IQ_QUESTIONS].sort(() => Math.random() - 0.5);
    setShuffledQuestions(shuffled);
    setGameState('playing');
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setStartTime(Date.now());
  }

  function handleAnswer(index: number) {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);

    const correct = index === shuffledQuestions[currentQuestion].correctIndex;
    if (correct) setScore((s) => s + 1);

    setShowExplanation(true);
  }

  function nextQuestion() {
    const next = currentQuestion + 1;
    if (next >= shuffledQuestions.length) {
      finishTest();
    } else {
      setCurrentQuestion(next);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  }

  async function finishTest() {
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    setGameState('result');

    if (session?.user) {
      await supabase.from('test_results').insert({
        user_id: session.user.id,
        test_id: null,
        score,
        max_score: shuffledQuestions.length,
        percentage: Math.round((score / shuffledQuestions.length) * 100),
        time_taken_seconds: timeTaken,
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
          <Text style={styles.menuTitle}>IQ Teszt</Text>
        </View>

        <View style={styles.menuContent}>
          <View style={styles.menuIcon}>
            <Ionicons name="bulb-outline" size={64} color="#00A651" />
          </View>
          <Text style={styles.menuDesc}>
            Logikai gondolkodás, számsorok, analógiák és térbeli feladatok.
          </Text>
          <Text style={styles.menuInfo}>
            {IQ_QUESTIONS.length} kérdés • Nincs időlimit
          </Text>
          <Button title="Teszt indítása" onPress={startTest} style={{ marginTop: theme.spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  if (gameState === 'result') {
    const pct = Math.round((score / shuffledQuestions.length) * 100);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultContainer}>
          <View style={styles.resultCircle}>
            <Text style={styles.resultScore}>{pct}%</Text>
          </View>
          <Text style={styles.resultTitle}>IQ Teszt Eredmény</Text>
          <Text style={styles.resultDetail}>
            {score}/{shuffledQuestions.length} helyes válasz
          </Text>
          <View style={styles.resultActions}>
            <Button title="Újra" onPress={startTest} />
            <Button title="Vissza" onPress={() => setGameState('menu')} variant="outline" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const q = shuffledQuestions[currentQuestion];

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / shuffledQuestions.length) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.questionContainer}>
        <Text style={styles.questionCount}>
          Kérdés {currentQuestion + 1}/{shuffledQuestions.length}
        </Text>
        <Text style={styles.questionText}>{q.question}</Text>

        <View style={styles.options}>
          {q.options.map((opt, i) => {
            let optStyle = styles.option;
            let optTextStyle = styles.optionText;

            if (selectedAnswer !== null) {
              if (i === q.correctIndex) {
                optStyle = { ...styles.option, ...styles.optionCorrect };
                optTextStyle = { ...styles.optionText, color: theme.colors.white };
              } else if (i === selectedAnswer && i !== q.correctIndex) {
                optStyle = { ...styles.option, ...styles.optionWrong };
                optTextStyle = { ...styles.optionText, color: theme.colors.white };
              }
            }

            return (
              <TouchableOpacity
                key={i}
                style={optStyle}
                onPress={() => handleAnswer(i)}
                disabled={selectedAnswer !== null}
              >
                <Text style={styles.optionLetter}>
                  {String.fromCharCode(65 + i)}
                </Text>
                <Text style={optTextStyle}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {showExplanation && (
          <View style={styles.explanation}>
            <Text style={styles.explanationTitle}>
              {selectedAnswer === q.correctIndex ? '✓ Helyes!' : '✗ Helytelen'}
            </Text>
            <Text style={styles.explanationText}>{q.explanation}</Text>
            <Button title="Következő" onPress={nextQuestion} style={{ marginTop: theme.spacing.md }} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    gap: theme.spacing.md,
  },
  backBtn: {
    padding: theme.spacing.xs,
  },
  menuTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: '800',
    color: theme.colors.black,
  },
  menuContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  menuIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#00A65115',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  menuDesc: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.gray,
    textAlign: 'center',
    lineHeight: 24,
  },
  menuInfo: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: '700',
    marginTop: theme.spacing.md,
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
  questionCount: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.mediumGray,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  questionText: {
    fontSize: theme.fontSizes.xl,
    fontWeight: '700',
    color: theme.colors.black,
    lineHeight: 32,
    marginBottom: theme.spacing.xl,
  },
  options: {
    gap: theme.spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.cardBorder,
  },
  optionCorrect: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  optionWrong: {
    backgroundColor: theme.colors.error,
    borderColor: theme.colors.error,
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    textAlign: 'center',
    lineHeight: 32,
    fontSize: theme.fontSizes.sm,
    fontWeight: '700',
    color: theme.colors.darkGray,
    marginRight: theme.spacing.md,
    overflow: 'hidden',
  },
  optionText: {
    flex: 1,
    fontSize: theme.fontSizes.md,
    color: theme.colors.black,
    fontWeight: '500',
  },
  // Explanation
  explanation: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  explanationTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '700',
    color: theme.colors.black,
    marginBottom: theme.spacing.xs,
  },
  explanationText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.gray,
    lineHeight: 22,
  },
  // Result
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  resultCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  resultScore: {
    fontSize: 36,
    fontWeight: '900',
    color: theme.colors.white,
  },
  resultTitle: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: '800',
    color: theme.colors.black,
    marginBottom: theme.spacing.sm,
  },
  resultDetail: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.gray,
    marginBottom: theme.spacing.lg,
  },
  resultActions: {
    width: '100%',
    gap: theme.spacing.sm,
  },
});
