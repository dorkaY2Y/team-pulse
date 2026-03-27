import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { theme } from '../../lib/theme';

type Phase = 'intro' | 'running' | 'between' | 'finished';

interface TestStep {
  id: string;
  title: string;
  route: string;
  maxTime: number; // seconds
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const SELECTION_STEPS: TestStep[] = [
  { id: 'iq', title: 'IQ Teszt', route: '/competitor/tests/iq', maxTime: 900, icon: 'bulb-outline', color: '#0084AD' },
  { id: 'attention', title: 'Figyelem Teszt', route: '/competitor/tests/attention', maxTime: 300, icon: 'scan-outline', color: '#0077C8' },
  { id: 'concentration', title: 'Koncentráció', route: '/competitor/tests/concentration', maxTime: 300, icon: 'eye-outline', color: '#72D0EB' },
  { id: 'mindset', title: 'Fejlődési Szemlélet', route: '/competitor/tests/mindset', maxTime: 300, icon: 'analytics-outline', color: '#4A0D66' },
  { id: 'goals', title: 'Célorientáció', route: '/competitor/tests/goals', maxTime: 300, icon: 'flag-outline', color: '#FF6C0C' },
];

export default function SelectionScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentStep, setCurrentStep] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
  const [stepTimes, setStepTimes] = useState<number[]>([]);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Timer
  useEffect(() => {
    if (!timerActive) return;

    timerRef.current = setInterval(() => {
      setTimeElapsed((t) => t + 1);
      setTotalTimeElapsed((t) => t + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function startSelection() {
    setPhase('running');
    setCurrentStep(0);
    setTimeElapsed(0);
    setTotalTimeElapsed(0);
    setStepTimes([]);
    setTimerActive(true);
  }

  function handleDone() {
    // Save time for this step
    setTimerActive(false);
    const newStepTimes = [...stepTimes, timeElapsed];
    setStepTimes(newStepTimes);

    const nextStep = currentStep + 1;
    if (nextStep >= SELECTION_STEPS.length) {
      setPhase('finished');
    } else {
      setCurrentStep(nextStep);
      setPhase('between');
    }
  }

  function startNextStep() {
    setTimeElapsed(0);
    setTimerActive(true);
    setPhase('running');
  }

  function handleQuit() {
    Alert.alert(
      'Kilépés',
      'Biztosan ki akarsz lépni a kiválasztásból? Az eddigi eredményeid elvesznek.',
      [
        { text: 'Mégsem', style: 'cancel' },
        { text: 'Kilépés', style: 'destructive', onPress: () => router.back() },
      ]
    );
  }

  // INTRO
  if (phase === 'intro') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.introContainer}>
          <View style={styles.introIcon}>
            <Ionicons name="trophy-outline" size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.introTitle}>Mentális Kiválasztás</Text>
          <Text style={styles.introDesc}>
            Az alábbi teszteket egymás után fogod kitölteni. Minden tesztnél fut az idő.
            Ha végeztél egy feladattal, nyomd meg a "Kész vagyok" gombot, és jön a következő.
          </Text>

          <View style={styles.stepsPreview}>
            {SELECTION_STEPS.map((step, i) => (
              <View key={step.id} style={styles.stepPreviewRow}>
                <View style={[styles.stepNumber, { backgroundColor: step.color }]}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                <View style={styles.stepPreviewInfo}>
                  <Text style={styles.stepPreviewTitle}>{step.title}</Text>
                  <Text style={styles.stepPreviewTime}>Max {Math.round(step.maxTime / 60)} perc</Text>
                </View>
                <Ionicons name={step.icon} size={20} color={step.color} />
              </View>
            ))}
          </View>

          <View style={styles.totalTime}>
            <Ionicons name="time-outline" size={18} color={theme.colors.gray} />
            <Text style={styles.totalTimeText}>
              Teljes idő: max ~{Math.round(SELECTION_STEPS.reduce((s, t) => s + t.maxTime, 0) / 60)} perc
            </Text>
          </View>

          <Button title="Kiválasztás indítása" onPress={startSelection} style={{ marginTop: theme.spacing.xl }} />

          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>Vissza</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // BETWEEN steps
  if (phase === 'between') {
    const nextStep = SELECTION_STEPS[currentStep];
    const prevStep = SELECTION_STEPS[currentStep - 1];

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.betweenContainer}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={40} color={theme.colors.white} />
          </View>
          <Text style={styles.betweenTitle}>{prevStep.title} kész!</Text>
          <Text style={styles.betweenTime}>
            Időd: {formatTime(stepTimes[stepTimes.length - 1])}
          </Text>

          <View style={styles.progressDots}>
            {SELECTION_STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i < currentStep && styles.progressDotDone,
                  i === currentStep && styles.progressDotCurrent,
                ]}
              />
            ))}
          </View>

          <View style={styles.nextCard}>
            <Text style={styles.nextLabel}>Következő feladat</Text>
            <View style={styles.nextRow}>
              <Ionicons name={nextStep.icon} size={24} color={nextStep.color} />
              <Text style={styles.nextTitle}>{nextStep.title}</Text>
            </View>
          </View>

          <Button title="Tovább" onPress={startNextStep} style={{ marginTop: theme.spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  // FINISHED
  if (phase === 'finished') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.finishedContainer}>
          <View style={styles.finishedIcon}>
            <Ionicons name="ribbon-outline" size={56} color={theme.colors.primary} />
          </View>
          <Text style={styles.finishedTitle}>Kiválasztás kész!</Text>
          <Text style={styles.finishedTotal}>
            Összes idő: {formatTime(totalTimeElapsed)}
          </Text>

          <View style={styles.resultsList}>
            {SELECTION_STEPS.map((step, i) => (
              <View key={step.id} style={styles.resultRow}>
                <Ionicons name={step.icon} size={20} color={step.color} />
                <Text style={styles.resultName}>{step.title}</Text>
                <Text style={styles.resultTime}>{formatTime(stepTimes[i] || 0)}</Text>
              </View>
            ))}
          </View>

          <Button title="Vissza a főoldalra" onPress={() => router.replace('/competitor')} style={{ marginTop: theme.spacing.xl }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // RUNNING - current test with timer
  const step = SELECTION_STEPS[currentStep];
  const maxTime = step.maxTime;
  const timePercent = Math.min((timeElapsed / maxTime) * 100, 100);
  const isOvertime = timeElapsed > maxTime;

  return (
    <SafeAreaView style={styles.container}>
      {/* Timer header */}
      <View style={styles.timerHeader}>
        <View style={styles.timerHeaderTop}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{currentStep + 1}/{SELECTION_STEPS.length}</Text>
          </View>
          <Text style={styles.timerStepTitle}>{step.title}</Text>
          <TouchableOpacity onPress={handleQuit}>
            <Ionicons name="close" size={24} color={theme.colors.gray} />
          </TouchableOpacity>
        </View>

        <View style={styles.timerDisplay}>
          <Ionicons
            name="time-outline"
            size={20}
            color={isOvertime ? '#D51067' : theme.colors.primary}
          />
          <Text style={[styles.timerValue, isOvertime && styles.timerOvertime]}>
            {formatTime(timeElapsed)}
          </Text>
          <Text style={styles.timerMax}>/ {formatTime(maxTime)}</Text>
        </View>

        <View style={styles.timerBar}>
          <View style={[
            styles.timerBarFill,
            { width: `${Math.min(timePercent, 100)}%` },
            isOvertime && { backgroundColor: '#D51067' },
          ]} />
        </View>
      </View>

      {/* Test content area */}
      <View style={styles.testArea}>
        <View style={styles.testPlaceholder}>
          <Ionicons name={step.icon} size={64} color={step.color + '40'} />
          <Text style={styles.testPlaceholderTitle}>{step.title}</Text>
          <Text style={styles.testPlaceholderDesc}>
            Nyisd meg a tesztet és töltsd ki. Ha végeztél, nyomd meg a "Kész vagyok" gombot alul.
          </Text>
          <Button
            title="Teszt megnyitása"
            onPress={() => router.push(step.route as any)}
            variant="outline"
            style={{ marginTop: theme.spacing.md }}
          />
        </View>
      </View>

      {/* Done button - always visible */}
      <View style={styles.doneContainer}>
        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Ionicons name="checkmark-circle" size={24} color={theme.colors.white} />
          <Text style={styles.doneButtonText}>Kész vagyok</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  // Intro
  introContainer: { padding: theme.spacing.xl, alignItems: 'center' },
  introIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.primary + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.lg,
  },
  introTitle: { fontSize: theme.fontSizes.xxl, fontWeight: '800', color: theme.colors.black, marginBottom: theme.spacing.md },
  introDesc: { fontSize: theme.fontSizes.md, color: theme.colors.gray, textAlign: 'center', lineHeight: 24, marginBottom: theme.spacing.xl },
  stepsPreview: { width: '100%', gap: theme.spacing.sm },
  stepPreviewRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md, padding: theme.spacing.md, ...theme.shadows.sm,
  },
  stepNumber: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md,
  },
  stepNumberText: { color: theme.colors.white, fontSize: theme.fontSizes.sm, fontWeight: '700' },
  stepPreviewInfo: { flex: 1 },
  stepPreviewTitle: { fontSize: theme.fontSizes.md, fontWeight: '600', color: theme.colors.black },
  stepPreviewTime: { fontSize: theme.fontSizes.xs, color: theme.colors.gray },
  totalTime: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: theme.spacing.lg },
  totalTimeText: { fontSize: theme.fontSizes.sm, color: theme.colors.gray },
  backLink: { marginTop: theme.spacing.lg },
  backLinkText: { fontSize: theme.fontSizes.md, color: theme.colors.primary, fontWeight: '600' },

  // Between
  betweenContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl },
  checkCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#0084AD',
    alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.lg,
  },
  betweenTitle: { fontSize: theme.fontSizes.xxl, fontWeight: '800', color: theme.colors.black },
  betweenTime: { fontSize: theme.fontSizes.lg, color: theme.colors.gray, marginTop: theme.spacing.xs },
  progressDots: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.xl },
  progressDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.colors.lightGray },
  progressDotDone: { backgroundColor: '#0084AD' },
  progressDotCurrent: { backgroundColor: theme.colors.primary, width: 24 },
  nextCard: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg,
    width: '100%', marginTop: theme.spacing.xl, ...theme.shadows.sm,
  },
  nextLabel: { fontSize: theme.fontSizes.xs, color: theme.colors.mediumGray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: theme.spacing.sm },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  nextTitle: { fontSize: theme.fontSizes.lg, fontWeight: '700', color: theme.colors.black },

  // Finished
  finishedContainer: { padding: theme.spacing.xl, alignItems: 'center' },
  finishedIcon: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: theme.colors.primary + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.lg,
  },
  finishedTitle: { fontSize: theme.fontSizes.xxl, fontWeight: '800', color: theme.colors.black },
  finishedTotal: { fontSize: theme.fontSizes.lg, color: theme.colors.primary, fontWeight: '700', marginTop: theme.spacing.sm },
  resultsList: { width: '100%', marginTop: theme.spacing.xl, gap: theme.spacing.sm },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md, padding: theme.spacing.md, ...theme.shadows.sm,
  },
  resultName: { flex: 1, fontSize: theme.fontSizes.md, fontWeight: '600', color: theme.colors.black, marginLeft: theme.spacing.sm },
  resultTime: { fontSize: theme.fontSizes.md, fontWeight: '700', color: theme.colors.primary },

  // Running
  timerHeader: {
    backgroundColor: theme.colors.white, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1, borderBottomColor: theme.colors.lightGray,
  },
  timerHeaderTop: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm },
  stepBadge: {
    backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing.sm, paddingVertical: 2,
    borderRadius: theme.borderRadius.full, marginRight: theme.spacing.sm,
  },
  stepBadgeText: { color: theme.colors.white, fontSize: theme.fontSizes.xs, fontWeight: '700' },
  timerStepTitle: { flex: 1, fontSize: theme.fontSizes.md, fontWeight: '700', color: theme.colors.black },
  timerDisplay: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: theme.spacing.xs },
  timerValue: { fontSize: theme.fontSizes.xxl, fontWeight: '900', color: theme.colors.primary },
  timerOvertime: { color: '#D51067' },
  timerMax: { fontSize: theme.fontSizes.sm, color: theme.colors.mediumGray },
  timerBar: { height: 4, backgroundColor: theme.colors.lightGray, borderRadius: 2 },
  timerBarFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 2 },

  // Test area
  testArea: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl },
  testPlaceholder: { alignItems: 'center' },
  testPlaceholderTitle: { fontSize: theme.fontSizes.xl, fontWeight: '700', color: theme.colors.black, marginTop: theme.spacing.md },
  testPlaceholderDesc: { fontSize: theme.fontSizes.sm, color: theme.colors.gray, textAlign: 'center', marginTop: theme.spacing.sm, lineHeight: 22 },

  // Done button
  doneContainer: { padding: theme.spacing.md, backgroundColor: theme.colors.white, borderTopWidth: 1, borderTopColor: theme.colors.lightGray },
  doneButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm,
    backgroundColor: '#0084AD', borderRadius: theme.borderRadius.md, paddingVertical: 16,
  },
  doneButtonText: { color: theme.colors.white, fontSize: theme.fontSizes.lg, fontWeight: '700' },
});
