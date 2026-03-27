import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { saveResult } from '../../../lib/results';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/Button';
import { theme } from '../../../lib/theme';

type GameState = 'loading' | 'menu' | 'playing' | 'result';

interface QuizQuestion {
  id: string;
  question_text: string;
  options: { text: string; is_correct: boolean }[];
}

// Placeholder questions until test bank is loaded
const DEMO_QUESTIONS: QuizQuestion[] = [
  {
    id: '1',
    question_text: 'Melyik országban rendezték a 2024-es WorldSkills versenyt?',
    options: [
      { text: 'Franciaország (Lyon)', is_correct: true },
      { text: 'Kína (Shanghai)', is_correct: false },
      { text: 'Japán (Tokió)', is_correct: false },
      { text: 'Oroszország (Kazany)', is_correct: false },
    ],
  },
  {
    id: '2',
    question_text: 'Hány évente rendezik a WorldSkills versenyt?',
    options: [
      { text: 'Minden évben', is_correct: false },
      { text: 'Kétévente', is_correct: true },
      { text: 'Háromévente', is_correct: false },
      { text: 'Négyévente', is_correct: false },
    ],
  },
  {
    id: '3',
    question_text: 'Mi a WorldSkills szervezet mottója?',
    options: [
      { text: 'Skills for All', is_correct: false },
      { text: 'Raising the bar', is_correct: false },
      { text: 'One School One Country', is_correct: false },
      { text: 'Skills Change Lives', is_correct: true },
    ],
  },
  {
    id: '4',
    question_text: 'Melyik évben alapították a WorldSkills szervezetet?',
    options: [
      { text: '1946', is_correct: false },
      { text: '1950', is_correct: true },
      { text: '1960', is_correct: false },
      { text: '1972', is_correct: false },
    ],
  },
  {
    id: '5',
    question_text: 'Hány éves kortól lehet részt venni a WorldSkills versenyen?',
    options: [
      { text: '16 éves kortól', is_correct: false },
      { text: '18 éves kortól', is_correct: true },
      { text: '20 éves kortól', is_correct: false },
      { text: 'Nincs korhatár', is_correct: false },
    ],
  },
];

export default function QuizScreen() {
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState>('menu');
  const [questions, setQuestions] = useState<QuizQuestion[]>(DEMO_QUESTIONS);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Timer
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerActive, currentQuestion]);

  function handleTimeUp() {
    setTimerActive(false);
    nextQuestion();
  }

  async function loadQuestions() {
    setGameState('loading');

    // Try loading from Supabase
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('question_type', 'multiple_choice')
      .limit(20);

    if (data && data.length > 0) {
      setQuestions(data.map((q: any) => ({
        id: q.id,
        question_text: q.question_text,
        options: q.options,
      })));
    } else {
      // Use demo questions
      setQuestions([...DEMO_QUESTIONS].sort(() => Math.random() - 0.5));
    }

    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setStartTime(Date.now());
    setTimeLeft(30);
    setTimerActive(true);
    setGameState('playing');
  }

  function handleAnswer(index: number) {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setTimerActive(false);

    if (questions[currentQuestion].options[index].is_correct) {
      setScore((s) => s + 1);
    }

    setTimeout(nextQuestion, 1200);
  }

  function nextQuestion() {
    const next = currentQuestion + 1;
    if (next >= questions.length) {
      finishTest();
    } else {
      setCurrentQuestion(next);
      setSelectedAnswer(null);
      setTimeLeft(30);
      setTimerActive(true);
    }
  }

  async function finishTest() {
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    setTimerActive(false);
    setGameState('result');

    await saveResult('quiz' as any, 'WorldSkills Kvíz', score, questions.length, timeTaken);
  }

  if (gameState === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Kérdések betöltése...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (gameState === 'menu') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.menuHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.black} />
          </TouchableOpacity>
          <Text style={styles.menuTitle}>WorldSkills Kvíz</Text>
        </View>

        <ScrollView contentContainerStyle={styles.menuContent}>
          <View style={styles.menuIcon}>
            <Ionicons name="help-circle-outline" size={64} color={theme.colors.primary} />
          </View>
          <Text style={styles.menuMainTitle}>Feleletválasztós Kvíz</Text>
          <Text style={styles.menuDesc}>
            Tudásfelmérő kérdéssor a WorldSkills versenyekről. Minden kérdésre 30 másodperced van válaszolni.
          </Text>
          <Text style={styles.menuInfo}>
            {questions.length} kérdés • 30 mp/kérdés
          </Text>
          <Button
            title="Teszt indítása"
            onPress={loadQuestions}
            style={{ marginTop: theme.spacing.lg }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (gameState === 'result') {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultContainer}>
          <View style={[
            styles.resultCircle,
            pct >= 80 && { backgroundColor: theme.colors.success },
            pct < 50 && { backgroundColor: theme.colors.error },
          ]}>
            <Text style={styles.resultScore}>{pct}%</Text>
          </View>
          <Text style={styles.resultTitle}>Kvíz Eredmény</Text>
          <Text style={styles.resultDetail}>
            {score}/{questions.length} helyes válasz
          </Text>
          <View style={styles.resultActions}>
            <Button title="Újra" onPress={loadQuestions} />
            <Button title="Vissza" onPress={() => setGameState('menu')} variant="outline" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const q = questions[currentQuestion];
  const timerPct = (timeLeft / 30) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / questions.length) * 100}%` }]} />
      </View>

      {/* Timer */}
      <View style={styles.timerBar}>
        <View style={[
          styles.timerFill,
          { width: `${timerPct}%` },
          timeLeft <= 5 && { backgroundColor: theme.colors.error },
        ]} />
      </View>

      <ScrollView contentContainerStyle={styles.questionContainer}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionCount}>
            {currentQuestion + 1}/{questions.length}
          </Text>
          <View style={styles.timerBadge}>
            <Ionicons name="time-outline" size={16} color={timeLeft <= 5 ? theme.colors.error : theme.colors.gray} />
            <Text style={[styles.timerText, timeLeft <= 5 && { color: theme.colors.error }]}>
              {timeLeft}s
            </Text>
          </View>
        </View>

        <Text style={styles.questionText}>{q.question_text}</Text>

        <View style={styles.options}>
          {q.options.map((opt, i) => {
            let optStyle: any[] = [styles.option];
            let textColor: string = theme.colors.black;

            if (selectedAnswer !== null) {
              if (opt.is_correct) {
                optStyle = [styles.option, styles.optionCorrect];
                textColor = theme.colors.white;
              } else if (i === selectedAnswer) {
                optStyle = [styles.option, styles.optionWrong];
                textColor = theme.colors.white;
              }
            }

            return (
              <TouchableOpacity
                key={i}
                style={optStyle}
                onPress={() => handleAnswer(i)}
                disabled={selectedAnswer !== null}
              >
                <View style={styles.optionLetterContainer}>
                  <Text style={styles.optionLetter}>
                    {String.fromCharCode(65 + i)}
                  </Text>
                </View>
                <Text style={[styles.optionText, { color: textColor }]}>{opt.text}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSizes.md,
    color: theme.colors.gray,
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
    backgroundColor: theme.colors.primary + '15',
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
  },
  menuInfo: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: '700',
    marginTop: theme.spacing.md,
  },
  // Progress & Timer
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.lightGray,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  timerBar: {
    height: 3,
    backgroundColor: theme.colors.lightGray,
  },
  timerFill: {
    height: '100%',
    backgroundColor: theme.colors.warning,
  },
  // Question
  questionContainer: {
    padding: theme.spacing.lg,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  questionCount: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.mediumGray,
    fontWeight: '600',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  timerText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '700',
    color: theme.colors.gray,
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
  optionLetterContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  optionLetter: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '700',
    color: theme.colors.darkGray,
  },
  optionText: {
    flex: 1,
    fontSize: theme.fontSizes.md,
    fontWeight: '500',
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
    backgroundColor: theme.colors.warning,
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
