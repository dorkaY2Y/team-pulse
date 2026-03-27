import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { saveResult } from '../../../lib/results';
import { Button } from '../../../components/Button';
import { theme } from '../../../lib/theme';

type GameState = 'menu' | 'playing' | 'result';
type ConcentrationTest = 'stroop' | 'sequence' | 'reaction';

// Stroop test colors
const STROOP_COLORS = [
  { name: 'PIROS', color: '#E4002B' },
  { name: 'KÉK', color: '#0077C8' },
  { name: 'ZÖLD', color: '#00A651' },
  { name: 'SÁRGA', color: '#FFB81C' },
];

export default function ConcentrationScreen() {
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState>('menu');
  const [testType, setTestType] = useState<ConcentrationTest>('stroop');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [totalRounds] = useState(15);
  const [startTime, setStartTime] = useState(0);

  // Stroop state
  const [stroopWord, setStroopWord] = useState('');
  const [stroopColor, setStroopColor] = useState('');
  const [stroopOptions, setStroopOptions] = useState<typeof STROOP_COLORS>([]);

  // Sequence memory state
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [showingSequence, setShowingSequence] = useState(false);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [sequenceLength, setSequenceLength] = useState(3);

  // Reaction time state
  const [reactionState, setReactionState] = useState<'wait' | 'ready' | 'go' | 'done'>('wait');
  const [reactionTime, setReactionTime] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const reactionStart = useRef(0);
  const reactionTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  function startTest(type: ConcentrationTest) {
    setTestType(type);
    setGameState('playing');
    setScore(0);
    setRound(0);
    setStartTime(Date.now());

    if (type === 'stroop') generateStroopRound();
    if (type === 'sequence') startSequenceRound(3);
    if (type === 'reaction') startReactionRound();
  }

  // ---- STROOP TEST ----
  function generateStroopRound() {
    const wordIdx = Math.floor(Math.random() * STROOP_COLORS.length);
    let colorIdx = Math.floor(Math.random() * STROOP_COLORS.length);
    // Make sure sometimes word and color match, sometimes not
    if (Math.random() > 0.4) {
      while (colorIdx === wordIdx) {
        colorIdx = Math.floor(Math.random() * STROOP_COLORS.length);
      }
    }

    setStroopWord(STROOP_COLORS[wordIdx].name);
    setStroopColor(STROOP_COLORS[colorIdx].color);

    // Shuffle options
    const shuffled = [...STROOP_COLORS].sort(() => Math.random() - 0.5);
    setStroopOptions(shuffled);
  }

  function handleStroopAnswer(selectedColor: string) {
    const correct = selectedColor === stroopColor;
    if (correct) setScore((s) => s + 1);

    const nextRound = round + 1;
    setRound(nextRound);

    if (nextRound >= totalRounds) {
      finishTest(correct ? score + 1 : score, totalRounds);
    } else {
      generateStroopRound();
    }
  }

  // ---- SEQUENCE MEMORY ----
  function startSequenceRound(len: number) {
    setSequenceLength(len);
    setPlayerSequence([]);
    const seq = Array.from({ length: len }, () => Math.floor(Math.random() * 9));
    setSequence(seq);
    setShowingSequence(true);

    // Show sequence one by one
    seq.forEach((cell, i) => {
      setTimeout(() => setActiveCell(cell), (i + 1) * 600);
      setTimeout(() => setActiveCell(null), (i + 1) * 600 + 400);
    });

    setTimeout(() => {
      setShowingSequence(false);
      setActiveCell(null);
    }, (seq.length + 1) * 600);
  }

  function handleSequenceTap(cell: number) {
    if (showingSequence) return;

    const newPlayerSeq = [...playerSequence, cell];
    setPlayerSequence(newPlayerSeq);

    const idx = newPlayerSeq.length - 1;
    if (newPlayerSeq[idx] !== sequence[idx]) {
      // Wrong
      finishTest(score, Math.max(sequenceLength - 3 + score, 1));
      return;
    }

    if (newPlayerSeq.length === sequence.length) {
      // Correct round
      setScore((s) => s + 1);
      const nextRound = round + 1;
      setRound(nextRound);

      if (nextRound >= 10) {
        finishTest(score + 1, 10);
      } else {
        setTimeout(() => startSequenceRound(sequenceLength + 1), 500);
      }
    }
  }

  // ---- REACTION TIME ----
  function startReactionRound() {
    setReactionState('wait');
    setReactionTimes([]);
    setRound(0);
    nextReaction();
  }

  function nextReaction() {
    setReactionState('ready');
    const delay = 1000 + Math.random() * 3000;
    reactionTimeout.current = setTimeout(() => {
      setReactionState('go');
      reactionStart.current = Date.now();
    }, delay);
  }

  function handleReactionTap() {
    if (reactionState === 'ready') {
      // Too early
      if (reactionTimeout.current) clearTimeout(reactionTimeout.current);
      setReactionState('wait');
      Alert.alert('Túl korai!', 'Várj, amíg zöld nem lesz a képernyő!', [
        { text: 'Újra', onPress: nextReaction },
      ]);
      return;
    }

    if (reactionState === 'go') {
      const time = Date.now() - reactionStart.current;
      setReactionTime(time);
      const newTimes = [...reactionTimes, time];
      setReactionTimes(newTimes);

      const nextRd = round + 1;
      setRound(nextRd);

      if (nextRd >= 5) {
        const avgTime = newTimes.reduce((a, b) => a + b, 0) / newTimes.length;
        // Score: lower is better. Max 10 points, -1 for every 50ms over 200ms
        const reactionScore = Math.max(0, Math.round(10 - Math.max(0, avgTime - 200) / 50));
        finishTest(reactionScore, 10);
      } else {
        setReactionState('done');
        setTimeout(nextReaction, 1000);
      }
    }
  }

  // ---- FINISH ----
  async function finishTest(finalScore: number, maxScore: number) {
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    setScore(finalScore);
    setGameState('result');

    const subtype = testType === 'stroop' ? 'concentration_stroop' : testType === 'sequence' ? 'concentration_sequence' : 'concentration_reaction';
    await saveResult(subtype as any, `Koncentráció - ${testType}`, finalScore, maxScore, timeTaken);
  }

  // ---- RENDER ----
  if (gameState === 'menu') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.menuHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.black} />
          </TouchableOpacity>
          <Text style={styles.menuTitle}>Koncentráció</Text>
        </View>

        <View style={styles.menuCards}>
          <TouchableOpacity style={styles.testCard} onPress={() => startTest('stroop')}>
            <View style={[styles.testCardIcon, { backgroundColor: '#0077C815' }]}>
              <Ionicons name="color-palette-outline" size={28} color="#0077C8" />
            </View>
            <Text style={styles.testCardTitle}>Stroop Teszt</Text>
            <Text style={styles.testCardDesc}>
              Válaszd ki a szöveg színét, ne azt, amit a szó mond!
            </Text>
            <Text style={styles.testCardInfo}>{totalRounds} kör</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testCard} onPress={() => startTest('sequence')}>
            <View style={[styles.testCardIcon, { backgroundColor: '#00A65115' }]}>
              <Ionicons name="grid-outline" size={28} color="#00A651" />
            </View>
            <Text style={styles.testCardTitle}>Számsor Memória</Text>
            <Text style={styles.testCardDesc}>
              Jegyezd meg és ismételd meg a villogó mintát!
            </Text>
            <Text style={styles.testCardInfo}>Egyre nehezebb</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testCard} onPress={() => startTest('reaction')}>
            <View style={[styles.testCardIcon, { backgroundColor: '#D5106715' }]}>
              <Ionicons name="flash-outline" size={28} color="#D51067" />
            </View>
            <Text style={styles.testCardTitle}>Reakcióidő</Text>
            <Text style={styles.testCardDesc}>
              Nyomj rá amilyen gyorsan csak tudsz, ha zöldre vált!
            </Text>
            <Text style={styles.testCardInfo}>5 kör</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (gameState === 'result') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultContainer}>
          <View style={styles.resultCircle}>
            <Text style={styles.resultScore}>{score}</Text>
            <Text style={styles.resultLabel}>pont</Text>
          </View>
          <Text style={styles.resultTitle}>Teszt vége!</Text>
          {testType === 'reaction' && reactionTimes.length > 0 && (
            <Text style={styles.resultDetail}>
              Átlagos reakcióidő: {Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)} ms
            </Text>
          )}
          <View style={styles.resultActions}>
            <Button title="Újra" onPress={() => startTest(testType)} />
            <Button title="Vissza" onPress={() => setGameState('menu')} variant="outline" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // PLAYING states
  return (
    <SafeAreaView style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(round / (testType === 'reaction' ? 5 : totalRounds)) * 100}%` }]} />
      </View>

      {testType === 'stroop' && (
        <View style={styles.gameContainer}>
          <Text style={styles.roundText}>Kör {round + 1}/{totalRounds}</Text>
          <Text style={styles.stroopInstruction}>Milyen SZÍNNEL van írva a szó?</Text>
          <Text style={[styles.stroopWord, { color: stroopColor }]}>{stroopWord}</Text>
          <View style={styles.stroopOptions}>
            {stroopOptions.map((opt) => (
              <TouchableOpacity
                key={opt.color}
                style={[styles.stroopButton, { backgroundColor: opt.color }]}
                onPress={() => handleStroopAnswer(opt.color)}
              >
                <Text style={styles.stroopButtonText}>{opt.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {testType === 'sequence' && (
        <View style={styles.gameContainer}>
          <Text style={styles.roundText}>
            {showingSequence ? 'Figyelj!' : 'Ismételd meg!'}
          </Text>
          <Text style={styles.sequenceLevel}>Szint: {sequenceLength - 2}</Text>
          <View style={styles.sequenceGrid}>
            {Array.from({ length: 9 }).map((_, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.sequenceCell,
                  activeCell === i && styles.sequenceCellActive,
                  !showingSequence && playerSequence.includes(i) && styles.sequenceCellSelected,
                ]}
                onPress={() => handleSequenceTap(i)}
                disabled={showingSequence}
              >
                <Text style={styles.sequenceCellText}>{i + 1}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {testType === 'reaction' && (
        <TouchableOpacity
          style={[
            styles.reactionContainer,
            reactionState === 'ready' && styles.reactionReady,
            reactionState === 'go' && styles.reactionGo,
            reactionState === 'done' && styles.reactionDone,
          ]}
          onPress={handleReactionTap}
          activeOpacity={1}
        >
          {reactionState === 'wait' && (
            <Text style={styles.reactionText}>Koppints a kezdéshez...</Text>
          )}
          {reactionState === 'ready' && (
            <Text style={styles.reactionText}>Várj...</Text>
          )}
          {reactionState === 'go' && (
            <Text style={styles.reactionText}>NYOMJ!</Text>
          )}
          {reactionState === 'done' && (
            <View>
              <Text style={styles.reactionText}>{reactionTime} ms</Text>
              <Text style={styles.reactionSubtext}>Kör {round}/5</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
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
  backBtn: {
    padding: theme.spacing.xs,
  },
  menuTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: '800',
    color: theme.colors.black,
  },
  menuCards: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  testCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  testCardIcon: {
    width: 50,
    height: 50,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  testCardTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '700',
    color: theme.colors.black,
  },
  testCardDesc: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.gray,
    marginTop: theme.spacing.xs,
  },
  testCardInfo: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.primary,
    fontWeight: '700',
    marginTop: theme.spacing.sm,
    textTransform: 'uppercase',
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
  // Game
  gameContainer: {
    flex: 1,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.gray,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  // Stroop
  stroopInstruction: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.darkGray,
    marginBottom: theme.spacing.xl,
  },
  stroopWord: {
    fontSize: 56,
    fontWeight: '900',
    marginBottom: theme.spacing.xxl,
  },
  stroopOptions: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  stroopButton: {
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  stroopButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.lg,
    fontWeight: '700',
  },
  // Sequence
  sequenceLevel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: '700',
    marginBottom: theme.spacing.lg,
  },
  sequenceGrid: {
    width: 240,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sequenceCell: {
    width: 72,
    height: 72,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sequenceCellActive: {
    backgroundColor: theme.colors.primary,
  },
  sequenceCellSelected: {
    backgroundColor: theme.colors.info + '40',
  },
  sequenceCellText: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '700',
    color: theme.colors.darkGray,
  },
  // Reaction
  reactionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.darkGray,
  },
  reactionReady: {
    backgroundColor: '#D51067',
  },
  reactionGo: {
    backgroundColor: '#00A651',
  },
  reactionDone: {
    backgroundColor: theme.colors.darkGray,
  },
  reactionText: {
    fontSize: 36,
    fontWeight: '900',
    color: theme.colors.white,
    textAlign: 'center',
  },
  reactionSubtext: {
    fontSize: theme.fontSizes.md,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: theme.spacing.sm,
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
    fontSize: 42,
    fontWeight: '900',
    color: theme.colors.white,
  },
  resultLabel: {
    fontSize: theme.fontSizes.sm,
    color: 'rgba(255,255,255,0.8)',
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
