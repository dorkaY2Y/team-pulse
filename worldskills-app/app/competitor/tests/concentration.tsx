import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { saveResult } from '../../../lib/results';
import { Button } from '../../../components/Button';
import { theme } from '../../../lib/theme';

type GameState = 'menu' | 'playing' | 'result';
type ConcentrationTest = 'stroop' | 'sequence' | 'reaction' | 'schulte' | 'pairs' | 'numberHunt';

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

  // Schulte table state
  const [schulteGrid, setSchulteGrid] = useState<number[]>([]);
  const [schulteNext, setSchulteNext] = useState(1);
  const [schulteErrors, setSchulteErrors] = useState(0);
  const [schulteTimer, setSchulteTimer] = useState(0);
  const schulteInterval = useRef<ReturnType<typeof setInterval>>(undefined);

  // Pairs (memory cards) state
  const [pairsCards, setPairsCards] = useState<{ id: number; symbol: string; flipped: boolean; matched: boolean }[]>([]);
  const [pairsFlipped, setPairsFlipped] = useState<number[]>([]);
  const [pairsMoves, setPairsMoves] = useState(0);
  const [pairsMatched, setPairsMatched] = useState(0);
  const pairsLocked = useRef(false);

  // Number hunt state
  const [huntGrid, setHuntGrid] = useState<number[]>([]);
  const [huntTarget, setHuntTarget] = useState(0);
  const [huntFound, setHuntFound] = useState(0);
  const [huntTotal] = useState(10);
  const [huntTimer, setHuntTimer] = useState(0);
  const huntInterval = useRef<ReturnType<typeof setInterval>>(undefined);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (schulteInterval.current) clearInterval(schulteInterval.current);
      if (huntInterval.current) clearInterval(huntInterval.current);
    };
  }, []);

  function startTest(type: ConcentrationTest) {
    setTestType(type);
    setGameState('playing');
    setScore(0);
    setRound(0);
    setStartTime(Date.now());

    if (type === 'stroop') generateStroopRound();
    if (type === 'sequence') startSequenceRound(3);
    if (type === 'reaction') startReactionRound();
    if (type === 'schulte') startSchulte();
    if (type === 'pairs') startPairs();
    if (type === 'numberHunt') startNumberHunt();
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

  // ---- SCHULTE TABLE ----
  function startSchulte() {
    const nums = Array.from({ length: 25 }, (_, i) => i + 1);
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    setSchulteGrid(nums);
    setSchulteNext(1);
    setSchulteErrors(0);
    setSchulteTimer(0);
    if (schulteInterval.current) clearInterval(schulteInterval.current);
    schulteInterval.current = setInterval(() => setSchulteTimer((t) => t + 1), 100);
  }

  function handleSchulteTap(num: number) {
    if (num === schulteNext) {
      const next = schulteNext + 1;
      setSchulteNext(next);
      if (next > 25) {
        if (schulteInterval.current) clearInterval(schulteInterval.current);
        const timeSeconds = Math.round(schulteTimer / 10);
        // Score: max 10 points. Under 30s = 10, each 5s over = -1 point
        const s = Math.max(0, Math.round(10 - Math.max(0, timeSeconds - 30) / 5));
        finishTest(s, 10);
      }
    } else {
      setSchulteErrors((e) => e + 1);
    }
  }

  // ---- PAIRS (MEMORY CARDS) ----
  function startPairs() {
    const symbols = ['◆', '★', '●', '▲', '■', '♥', '♦', '♣'];
    const deck = [...symbols, ...symbols].map((s, i) => ({
      id: i,
      symbol: s,
      flipped: false,
      matched: false,
    }));
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    setPairsCards(deck);
    setPairsFlipped([]);
    setPairsMoves(0);
    setPairsMatched(0);
    pairsLocked.current = false;
  }

  function handlePairsTap(idx: number) {
    if (pairsLocked.current) return;
    const card = pairsCards[idx];
    if (card.flipped || card.matched) return;

    const newCards = [...pairsCards];
    newCards[idx] = { ...newCards[idx], flipped: true };
    setPairsCards(newCards);

    const newFlipped = [...pairsFlipped, idx];
    setPairsFlipped(newFlipped);

    if (newFlipped.length === 2) {
      pairsLocked.current = true;
      setPairsMoves((m) => m + 1);
      const [a, b] = newFlipped;

      if (newCards[a].symbol === newCards[b].symbol) {
        // Match!
        newCards[a] = { ...newCards[a], matched: true };
        newCards[b] = { ...newCards[b], matched: true };
        setPairsCards(newCards);
        setPairsFlipped([]);
        const matched = pairsMatched + 1;
        setPairsMatched(matched);
        pairsLocked.current = false;

        if (matched >= 8) {
          const moves = pairsMoves + 1;
          // Score: max 10 points. 8 moves (perfect) = 10, each extra move = -0.5
          const s = Math.max(0, Math.round(10 - Math.max(0, moves - 8) * 0.5));
          setTimeout(() => finishTest(s, 10), 300);
        }
      } else {
        // No match, flip back
        setTimeout(() => {
          const resetCards = [...newCards];
          resetCards[a] = { ...resetCards[a], flipped: false };
          resetCards[b] = { ...resetCards[b], flipped: false };
          setPairsCards(resetCards);
          setPairsFlipped([]);
          pairsLocked.current = false;
        }, 800);
      }
    }
  }

  // ---- NUMBER HUNT ----
  function startNumberHunt() {
    setHuntFound(0);
    setHuntTimer(0);
    if (huntInterval.current) clearInterval(huntInterval.current);
    huntInterval.current = setInterval(() => setHuntTimer((t) => t + 1), 100);
    generateHuntRound();
  }

  function generateHuntRound() {
    const target = Math.floor(Math.random() * 90) + 10; // 2-digit
    const grid: number[] = [];
    // Put target at a random position
    const targetPos = Math.floor(Math.random() * 36);
    for (let i = 0; i < 36; i++) {
      if (i === targetPos) {
        grid.push(target);
      } else {
        let num;
        do {
          num = Math.floor(Math.random() * 90) + 10;
        } while (num === target);
        grid.push(num);
      }
    }
    setHuntGrid(grid);
    setHuntTarget(target);
  }

  function handleHuntTap(num: number) {
    if (num === huntTarget) {
      const found = huntFound + 1;
      setHuntFound(found);
      if (found >= huntTotal) {
        if (huntInterval.current) clearInterval(huntInterval.current);
        const timeSeconds = Math.round(huntTimer / 10);
        // Score: max 10. Under 20s = 10, each 3s over = -1
        const s = Math.max(0, Math.round(10 - Math.max(0, timeSeconds - 20) / 3));
        finishTest(s, 10);
      } else {
        generateHuntRound();
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

        <ScrollView style={styles.menuCards} contentContainerStyle={{ paddingBottom: 40 }}>
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

          <View style={styles.sectionDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>FEJLESZTŐ GYAKORLATOK</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.testCard} onPress={() => startTest('schulte')}>
            <View style={[styles.testCardIcon, { backgroundColor: '#0084AD15' }]}>
              <Ionicons name="apps-outline" size={28} color="#0084AD" />
            </View>
            <Text style={styles.testCardTitle}>Schulte-táblázat</Text>
            <Text style={styles.testCardDesc}>
              Találd meg a számokat 1-től 25-ig sorrendben, amilyen gyorsan csak tudod!
            </Text>
            <Text style={styles.testCardInfo}>Időre megy</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testCard} onPress={() => startTest('pairs')}>
            <View style={[styles.testCardIcon, { backgroundColor: '#FF6C0C15' }]}>
              <Ionicons name="copy-outline" size={28} color="#FF6C0C" />
            </View>
            <Text style={styles.testCardTitle}>Párkereső</Text>
            <Text style={styles.testCardDesc}>
              Fordítsd fel a kártyákat és találd meg az összes párt minél kevesebb lépésből!
            </Text>
            <Text style={styles.testCardInfo}>8 pár · 16 kártya</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testCard} onPress={() => startTest('numberHunt')}>
            <View style={[styles.testCardIcon, { backgroundColor: '#4A0D6615' }]}>
              <Ionicons name="search-outline" size={28} color="#4A0D66" />
            </View>
            <Text style={styles.testCardTitle}>Szám-vadász</Text>
            <Text style={styles.testCardDesc}>
              Keresd meg a célszámot a számtáblázatban, amilyen gyorsan csak tudod!
            </Text>
            <Text style={styles.testCardInfo}>10 kör · Időre megy</Text>
          </TouchableOpacity>
        </ScrollView>
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

      {testType === 'schulte' && (
        <View style={styles.gameContainer}>
          <Text style={styles.schulteTimer}>{(schulteTimer / 10).toFixed(1)}s</Text>
          <Text style={styles.schulteInstruction}>Koppints a következő számra: <Text style={styles.schulteTarget}>{schulteNext}</Text></Text>
          {schulteErrors > 0 && <Text style={styles.schulteErrors}>Hibák: {schulteErrors}</Text>}
          <View style={styles.schulteGrid}>
            {schulteGrid.map((num, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.schulteCell,
                  num < schulteNext && styles.schulteCellDone,
                ]}
                onPress={() => handleSchulteTap(num)}
                disabled={num < schulteNext}
              >
                <Text style={[
                  styles.schulteCellText,
                  num < schulteNext && styles.schulteCellTextDone,
                ]}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {testType === 'pairs' && (
        <View style={styles.gameContainer}>
          <Text style={styles.roundText}>Lépések: {pairsMoves} · Párok: {pairsMatched}/8</Text>
          <View style={styles.pairsGrid}>
            {pairsCards.map((card, i) => (
              <TouchableOpacity
                key={card.id}
                style={[
                  styles.pairsCard,
                  (card.flipped || card.matched) && styles.pairsCardFlipped,
                  card.matched && styles.pairsCardMatched,
                ]}
                onPress={() => handlePairsTap(i)}
                disabled={card.matched}
              >
                <Text style={[
                  styles.pairsCardText,
                  (card.flipped || card.matched) && styles.pairsCardTextFlipped,
                ]}>
                  {card.flipped || card.matched ? card.symbol : '?'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {testType === 'numberHunt' && (
        <View style={styles.gameContainer}>
          <Text style={styles.huntTimer}>{(huntTimer / 10).toFixed(1)}s</Text>
          <Text style={styles.huntInstruction}>Keresd meg:</Text>
          <Text style={styles.huntTargetText}>{huntTarget}</Text>
          <Text style={styles.huntProgress}>{huntFound}/{huntTotal}</Text>
          <View style={styles.huntGrid}>
            {huntGrid.map((num, i) => (
              <TouchableOpacity
                key={`${i}-${num}`}
                style={styles.huntCell}
                onPress={() => handleHuntTap(num)}
              >
                <Text style={styles.huntCellText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
  // Section divider
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.lightGray,
  },
  dividerText: {
    fontSize: theme.fontSizes.xs,
    fontWeight: '700',
    color: theme.colors.mediumGray,
    letterSpacing: 1,
  },
  // Schulte
  schulteTimer: {
    fontSize: 32,
    fontWeight: '900',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  schulteInstruction: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.darkGray,
    marginBottom: theme.spacing.sm,
  },
  schulteTarget: {
    fontWeight: '900',
    color: theme.colors.primary,
    fontSize: theme.fontSizes.lg,
  },
  schulteErrors: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
  },
  schulteGrid: {
    width: 320,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  schulteCell: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.lightGray,
  },
  schulteCellDone: {
    backgroundColor: theme.colors.primary + '15',
    borderColor: theme.colors.primary + '30',
  },
  schulteCellText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.black,
  },
  schulteCellTextDone: {
    color: theme.colors.primary,
    opacity: 0.4,
  },
  // Pairs
  pairsGrid: {
    width: 300,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  pairsCard: {
    width: 66,
    height: 80,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pairsCardFlipped: {
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  pairsCardMatched: {
    backgroundColor: theme.colors.primary + '15',
    borderColor: theme.colors.primary + '40',
  },
  pairsCardText: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.white,
  },
  pairsCardTextFlipped: {
    color: theme.colors.primary,
  },
  // Number hunt
  huntTimer: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  huntInstruction: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.gray,
  },
  huntTargetText: {
    fontSize: 48,
    fontWeight: '900',
    color: theme.colors.magenta,
    marginBottom: theme.spacing.xs,
  },
  huntProgress: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '700',
    color: theme.colors.mediumGray,
    marginBottom: theme.spacing.md,
  },
  huntGrid: {
    width: 320,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  huntCell: {
    width: 50,
    height: 48,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
  },
  huntCellText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.darkGray,
  },
});
