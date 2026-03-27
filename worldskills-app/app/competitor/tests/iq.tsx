import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { saveResult } from '../../../lib/results';
import { Button } from '../../../components/Button';
import { theme } from '../../../lib/theme';

type GameState = 'menu' | 'playing' | 'result';

// A 4x4 grid cell can be: 0 = empty, 1 = filled
type GridPattern = number[][];

interface MatrixQuestion {
  // 3x3 matrix of patterns, last one (index 8) is the answer
  matrix: GridPattern[];
  options: GridPattern[];
  correctIndex: number;
}

// Helper: create a 4x4 grid
function emptyGrid(): GridPattern {
  return Array.from({ length: 4 }, () => Array(4).fill(0));
}

function cloneGrid(g: GridPattern): GridPattern {
  return g.map((row) => [...row]);
}

// Set specific cells in a grid
function setCell(g: GridPattern, row: number, col: number, val: number = 1): GridPattern {
  const ng = cloneGrid(g);
  ng[row][col] = val;
  return ng;
}

// Generate pattern-based questions programmatically
function generateQuestions(): MatrixQuestion[] {
  const questions: MatrixQuestion[] = [];

  // === TYPE 1: Moving dot - dot moves position across rows/cols ===
  function movingDotQuestion(startRow: number, startCol: number, dRow: number, dCol: number): MatrixQuestion {
    const matrix: GridPattern[] = [];
    for (let mRow = 0; mRow < 3; mRow++) {
      for (let mCol = 0; mCol < 3; mCol++) {
        const g = emptyGrid();
        const r = (startRow + mRow * dRow + mCol * 0) % 4;
        const c = (startCol + mRow * 0 + mCol * dCol) % 4;
        g[r][c] = 1;
        matrix.push(g);
      }
    }
    const answer = matrix[8];
    const options = generateOptions(answer, 6);
    const correctIndex = Math.floor(Math.random() * 6);
    options[correctIndex] = answer;
    return { matrix: matrix.slice(0, 8).concat([emptyGrid()]), options, correctIndex };
  }

  // === TYPE 2: Accumulating pattern - each cell adds one more filled square ===
  function accumulatingQuestion(): MatrixQuestion {
    const positions = shuffle([
      [0,0],[0,1],[0,2],[0,3],[1,0],[1,1],[1,2],[1,3],[2,0],[2,1],[2,2],[2,3],[3,0],[3,1],[3,2],[3,3]
    ]).slice(0, 9);

    const matrix: GridPattern[] = [];
    let accumulated = emptyGrid();
    for (let i = 0; i < 9; i++) {
      accumulated = setCell(accumulated, positions[i][0], positions[i][1]);
      matrix.push(cloneGrid(accumulated));
    }

    const answer = matrix[8];
    const options = generateOptions(answer, 6);
    const correctIndex = Math.floor(Math.random() * 6);
    options[correctIndex] = answer;
    return { matrix: matrix.slice(0, 8).concat([emptyGrid()]), options, correctIndex };
  }

  // === TYPE 3: Row pattern - each row has the same pattern property ===
  function rowPatternQuestion(): MatrixQuestion {
    const matrix: GridPattern[] = [];
    // Each row: dot moves right. Each column: dot moves down.
    const baseRows = [0, 1, 2];
    const baseCols = [0, 2, 3];

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const g = emptyGrid();
        g[baseRows[r]][baseCols[c]] = 1;
        matrix.push(g);
      }
    }

    const answer = matrix[8];
    const options = generateOptions(answer, 6);
    const correctIndex = Math.floor(Math.random() * 6);
    options[correctIndex] = answer;
    return { matrix: matrix.slice(0, 8).concat([emptyGrid()]), options, correctIndex };
  }

  // === TYPE 4: Two dots with independent movement ===
  function twoDotQuestion(): MatrixQuestion {
    const matrix: GridPattern[] = [];
    // Dot A: top area, moves right per column
    // Dot B: bottom area, moves left per column
    const aRow = 0;
    const bRow = 3;
    const aCols = [0, 1, 2];
    const bCols = [3, 2, 1];
    const aRows = [0, 1, 2];

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const g = emptyGrid();
        g[aRows[r]][aCols[c]] = 1;
        g[bRow][bCols[c]] = 1;
        matrix.push(g);
      }
    }

    const answer = matrix[8];
    const options = generateOptions(answer, 6);
    const correctIndex = Math.floor(Math.random() * 6);
    options[correctIndex] = answer;
    return { matrix: matrix.slice(0, 8).concat([emptyGrid()]), options, correctIndex };
  }

  // === TYPE 5: Fill count pattern - row N has N filled cells ===
  function fillCountQuestion(): MatrixQuestion {
    const matrix: GridPattern[] = [];
    const allPos = shuffle([[0,0],[0,1],[0,2],[0,3],[1,0],[1,1],[1,2],[1,3],[2,0],[2,1],[2,2],[2,3],[3,0],[3,1],[3,2],[3,3]]);

    for (let r = 0; r < 3; r++) {
      const count = r + 1; // Row 0: 1 dot, Row 1: 2 dots, Row 2: 3 dots
      for (let c = 0; c < 3; c++) {
        const g = emptyGrid();
        // Each column shifts positions slightly
        for (let k = 0; k < count; k++) {
          const pos = allPos[(r * 3 + c + k * 4) % allPos.length];
          g[pos[0]][pos[1]] = 1;
        }
        matrix.push(g);
      }
    }

    const answer = matrix[8];
    const options = generateOptions(answer, 6);
    const correctIndex = Math.floor(Math.random() * 6);
    options[correctIndex] = answer;
    return { matrix: matrix.slice(0, 8).concat([emptyGrid()]), options, correctIndex };
  }

  // === TYPE 6: Diagonal pattern ===
  function diagonalQuestion(): MatrixQuestion {
    const matrix: GridPattern[] = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const g = emptyGrid();
        // Diagonal position determined by (r+c) mod 4
        const diagPos = (r + c) % 4;
        g[diagPos][diagPos] = 1;
        matrix.push(g);
      }
    }
    const answer = matrix[8];
    const options = generateOptions(answer, 6);
    const correctIndex = Math.floor(Math.random() * 6);
    options[correctIndex] = answer;
    return { matrix: matrix.slice(0, 8).concat([emptyGrid()]), options, correctIndex };
  }

  // === TYPE 7: Corner rotation ===
  function cornerRotationQuestion(): MatrixQuestion {
    const corners = [[0,0],[0,3],[3,3],[3,0]];
    const matrix: GridPattern[] = [];

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const g = emptyGrid();
        const cornerIdx = (r * 3 + c) % 4;
        const corner = corners[cornerIdx];
        g[corner[0]][corner[1]] = 1;
        // Add center dot for rows 1,2
        if (r > 0) g[r][c] = 1;
        matrix.push(g);
      }
    }
    const answer = matrix[8];
    const options = generateOptions(answer, 6);
    const correctIndex = Math.floor(Math.random() * 6);
    options[correctIndex] = answer;
    return { matrix: matrix.slice(0, 8).concat([emptyGrid()]), options, correctIndex };
  }

  // === TYPE 8: XOR / Overlay pattern (row logic) ===
  function xorQuestion(): MatrixQuestion {
    const matrix: GridPattern[] = [];
    for (let r = 0; r < 3; r++) {
      const a = emptyGrid();
      const b = emptyGrid();
      // Random positions for a and b
      const posA = [[r, 0], [r, 1]];
      const posB = [[r, 2], [r, 3]];
      posA.forEach(([pr, pc]) => { a[pr][pc] = 1; });
      posB.forEach(([pr, pc]) => { b[pr][pc] = 1; });
      // XOR: combine both
      const xor = emptyGrid();
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          xor[i][j] = a[i][j] ^ b[i][j];
        }
      }
      matrix.push(a, b, xor);
    }
    const answer = matrix[8];
    const options = generateOptions(answer, 6);
    const correctIndex = Math.floor(Math.random() * 6);
    options[correctIndex] = answer;
    return { matrix: matrix.slice(0, 8).concat([emptyGrid()]), options, correctIndex };
  }

  // === TYPE 9: L-shape rotation ===
  function lShapeQuestion(): MatrixQuestion {
    const shapes = [
      [[0,0],[1,0],[2,0],[2,1]], // L
      [[0,0],[0,1],[0,2],[1,0]], // rotated 90
      [[0,0],[0,1],[1,1],[2,1]], // rotated 180
      [[0,2],[1,0],[1,1],[1,2]], // rotated 270
    ];
    const matrix: GridPattern[] = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const g = emptyGrid();
        const shapeIdx = (r + c) % 4;
        shapes[shapeIdx].forEach(([sr, sc]) => {
          if (sr + r % 2 < 4 && sc < 4) g[sr][sc] = 1;
        });
        matrix.push(g);
      }
    }
    const answer = matrix[8];
    const options = generateOptions(answer, 6);
    const correctIndex = Math.floor(Math.random() * 6);
    options[correctIndex] = answer;
    return { matrix: matrix.slice(0, 8).concat([emptyGrid()]), options, correctIndex };
  }

  // === TYPE 10: Mirror pattern ===
  function mirrorQuestion(): MatrixQuestion {
    const matrix: GridPattern[] = [];
    for (let r = 0; r < 3; r++) {
      // Column 0: original
      const g1 = emptyGrid();
      const positions = [[r, 0], [r + 1 < 4 ? r + 1 : 0, 1]];
      positions.forEach(([pr, pc]) => { g1[pr][pc] = 1; });

      // Column 1: horizontal mirror
      const g2 = emptyGrid();
      positions.forEach(([pr, pc]) => { g2[pr][3 - pc] = 1; });

      // Column 2: vertical mirror of col 0
      const g3 = emptyGrid();
      positions.forEach(([pr, pc]) => { g3[3 - pr][pc] = 1; });

      matrix.push(g1, g2, g3);
    }
    const answer = matrix[8];
    const options = generateOptions(answer, 6);
    const correctIndex = Math.floor(Math.random() * 6);
    options[correctIndex] = answer;
    return { matrix: matrix.slice(0, 8).concat([emptyGrid()]), options, correctIndex };
  }

  // Generate all question types and shuffle
  const generators = [
    () => movingDotQuestion(0, 0, 1, 1),
    () => movingDotQuestion(1, 3, 0, -1),
    accumulatingQuestion,
    rowPatternQuestion,
    twoDotQuestion,
    fillCountQuestion,
    diagonalQuestion,
    cornerRotationQuestion,
    xorQuestion,
    lShapeQuestion,
    mirrorQuestion,
    () => movingDotQuestion(3, 0, -1, 1),
    () => movingDotQuestion(0, 1, 1, 0),
    accumulatingQuestion,
    rowPatternQuestion,
    twoDotQuestion,
    diagonalQuestion,
    cornerRotationQuestion,
    lShapeQuestion,
    mirrorQuestion,
  ];

  for (const gen of generators) {
    questions.push(gen());
  }

  return questions;
}

// Generate wrong options that look similar but are different
function generateOptions(answer: GridPattern, count: number): GridPattern[] {
  const options: GridPattern[] = [];
  for (let i = 0; i < count; i++) {
    const opt = cloneGrid(answer);
    // Modify 1-2 cells to create a wrong option
    const modifications = 1 + Math.floor(Math.random() * 2);
    for (let m = 0; m < modifications; m++) {
      const r = Math.floor(Math.random() * 4);
      const c = Math.floor(Math.random() * 4);
      opt[r][c] = opt[r][c] === 0 ? 1 : 0;
    }
    // Make sure it's actually different from the answer
    if (gridsEqual(opt, answer)) {
      const r = Math.floor(Math.random() * 4);
      const c = Math.floor(Math.random() * 4);
      opt[r][c] = opt[r][c] === 0 ? 1 : 0;
    }
    options.push(opt);
  }
  return options;
}

function gridsEqual(a: GridPattern, b: GridPattern): boolean {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Visual component for a 4x4 grid
function MiniGrid({ pattern, size = 40 }: { pattern: GridPattern; size?: number }) {
  const cellSize = size / 4;
  return (
    <View style={[miniGridStyles.container, { width: size, height: size }]}>
      {pattern.map((row, r) => (
        <View key={r} style={miniGridStyles.row}>
          {row.map((cell, c) => (
            <View
              key={c}
              style={[
                miniGridStyles.cell,
                { width: cellSize, height: cellSize },
                cell === 1 && miniGridStyles.filled,
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const miniGridStyles = StyleSheet.create({
  container: { borderWidth: 1, borderColor: '#999' },
  row: { flexDirection: 'row' },
  cell: { borderWidth: 0.5, borderColor: '#ccc', backgroundColor: '#fff' },
  filled: { backgroundColor: '#1A1A1A' },
});

export default function IQTestScreen() {
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState>('menu');
  const [questions, setQuestions] = useState<MatrixQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [timerActive, setTimerActive] = useState(false);
  const [startTime, setStartTime] = useState(0);

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
    const q = generateQuestions();
    setQuestions(q);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setTimeLeft(900);
    setTimerActive(true);
    setStartTime(Date.now());
    setGameState('playing');
  }

  function handleAnswer(index: number) {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);

    const correct = index === questions[currentQuestion].correctIndex;
    if (correct) setScore((s) => s + 1);

    setTimeout(() => {
      const next = currentQuestion + 1;
      if (next >= questions.length) {
        finishTest(correct ? score + 1 : score);
      } else {
        setCurrentQuestion(next);
        setSelectedAnswer(null);
      }
    }, 800);
  }

  async function finishTest(finalScore?: number) {
    const s = finalScore ?? score;
    setTimerActive(false);
    setGameState('result');
    setScore(s);

    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    await saveResult('iq', 'IQ Teszt', s, questions.length, timeTaken);
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
          <Text style={styles.menuTitle}>IQ Teszt</Text>
        </View>

        <ScrollView contentContainerStyle={styles.menuContent}>
          <View style={styles.menuIcon}>
            <Ionicons name="bulb-outline" size={64} color={theme.colors.teal} />
          </View>
          <Text style={styles.menuMainTitle}>Progresszív Mátrixok</Text>
          <Text style={styles.menuDesc}>
            Minden feladatnál egy 3×3-as mátrixot látsz, amelyből hiányzik az utolsó elem.
            A mintázat alapján válaszd ki a helyes elemet a 6 lehetőségből!
          </Text>

          {/* Example */}
          <View style={styles.exampleCard}>
            <Text style={styles.exampleTitle}>Példa</Text>
            <View style={styles.exampleMatrix}>
              {Array.from({ length: 8 }).map((_, i) => {
                const g = emptyGrid();
                g[Math.floor(i / 3)][i % 3] = 1;
                return <MiniGrid key={i} pattern={g} size={36} />;
              })}
              <View style={styles.questionMark}>
                <Text style={styles.questionMarkText}>?</Text>
              </View>
            </View>
            <Text style={styles.exampleHint}>Találd meg a mintát!</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoPill}>
              <Ionicons name="help-circle-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.infoPillText}>20 kérdés</Text>
            </View>
            <View style={styles.infoPill}>
              <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.infoPillText}>15 perc</Text>
            </View>
            <View style={styles.infoPill}>
              <Ionicons name="options-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.infoPillText}>A-F opciók</Text>
            </View>
          </View>

          <Button title="Teszt indítása" onPress={startTest} style={{ marginTop: theme.spacing.lg, width: '100%' }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (gameState === 'result') {
    const pct = Math.round((score / questions.length) * 100);
    let rating = '';
    let ratingColor: string = theme.colors.primary;
    if (pct >= 90) { rating = 'Kiemelkedő'; ratingColor = '#0084AD'; }
    else if (pct >= 75) { rating = 'Átlag feletti'; ratingColor = '#0084AD'; }
    else if (pct >= 50) { rating = 'Átlagos'; ratingColor = '#FF6C0C'; }
    else if (pct >= 25) { rating = 'Átlag alatti'; ratingColor = '#FEE300'; }
    else { rating = 'Fejlesztendő'; ratingColor = '#D51067'; }

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <Text style={styles.resultMainTitle}>IQ Teszt Eredmény</Text>

          <View style={[styles.resultCircle, { backgroundColor: ratingColor }]}>
            <Text style={styles.resultScore}>{score}</Text>
            <Text style={styles.resultLabel}>/ {questions.length}</Text>
          </View>

          <View style={[styles.ratingBadge, { backgroundColor: ratingColor + '20' }]}>
            <Text style={[styles.ratingText, { color: ratingColor }]}>{rating}</Text>
          </View>

          <Text style={styles.resultPct}>{pct}% helyes válasz</Text>
          <Text style={styles.resultTime}>
            Idő: {formatTime(900 - timeLeft)}
          </Text>

          <View style={styles.resultActions}>
            <Button title="Újra" onPress={startTest} />
            <Button title="Vissza" onPress={() => setGameState('menu')} variant="outline" />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // PLAYING
  const q = questions[currentQuestion];
  if (!q) return null;

  const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.playHeader}>
        <Text style={styles.playQuestion}>Kérdés {currentQuestion + 1}/{questions.length}</Text>
        <View style={[styles.timerBadge, timeLeft <= 60 && styles.timerUrgent]}>
          <Ionicons name="time-outline" size={16} color={timeLeft <= 60 ? '#fff' : theme.colors.primary} />
          <Text style={[styles.timerText, timeLeft <= 60 && { color: '#fff' }]}>{formatTime(timeLeft)}</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / questions.length) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.playContent}>
        <Text style={styles.instruction}>Melyik illik a kérdőjel helyére?</Text>

        {/* 3x3 Matrix */}
        <View style={styles.matrixContainer}>
          {[0, 1, 2].map((row) => (
            <View key={row} style={styles.matrixRow}>
              {[0, 1, 2].map((col) => {
                const idx = row * 3 + col;
                if (idx === 8) {
                  return (
                    <View key={col} style={[styles.matrixCell, styles.matrixCellMissing]}>
                      <Text style={styles.matrixQuestionMark}>?</Text>
                    </View>
                  );
                }
                return (
                  <View key={col} style={styles.matrixCell}>
                    <MiniGrid pattern={q.matrix[idx]} size={72} />
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Options A-F */}
        <View style={styles.optionsGrid}>
          {q.options.map((opt, i) => {
            let borderColor: string = theme.colors.cardBorder;
            let bg: string = theme.colors.card;

            if (selectedAnswer !== null) {
              if (i === q.correctIndex) {
                borderColor = theme.colors.success;
                bg = theme.colors.success + '15';
              } else if (i === selectedAnswer && i !== q.correctIndex) {
                borderColor = theme.colors.error;
                bg = theme.colors.error + '15';
              }
            }

            return (
              <TouchableOpacity
                key={i}
                style={[styles.optionCard, { borderColor, backgroundColor: bg }]}
                onPress={() => handleAnswer(i)}
                disabled={selectedAnswer !== null}
                activeOpacity={0.7}
              >
                <Text style={styles.optionLabel}>{OPTION_LABELS[i]}</Text>
                <MiniGrid pattern={opt} size={52} />
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
  menuMainTitle: { fontSize: theme.fontSizes.xxl, fontWeight: '800', color: theme.colors.black, marginBottom: theme.spacing.md },
  menuDesc: { fontSize: theme.fontSizes.md, color: theme.colors.gray, textAlign: 'center', lineHeight: 24, marginBottom: theme.spacing.lg },
  exampleCard: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md,
    width: '100%', ...theme.shadows.sm, marginBottom: theme.spacing.md, alignItems: 'center',
  },
  exampleTitle: { fontSize: theme.fontSizes.sm, fontWeight: '700', color: theme.colors.darkGray, marginBottom: theme.spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  exampleMatrix: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center', width: 120 },
  questionMark: {
    width: 36, height: 36, borderWidth: 1, borderColor: theme.colors.primary, borderRadius: 4,
    alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary + '10',
  },
  questionMarkText: { fontSize: 20, fontWeight: '800', color: theme.colors.primary },
  exampleHint: { fontSize: theme.fontSizes.xs, color: theme.colors.gray, marginTop: theme.spacing.sm },
  infoRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  infoPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, borderRadius: theme.borderRadius.full,
  },
  infoPillText: { fontSize: theme.fontSizes.xs, fontWeight: '600', color: theme.colors.primary },
  // Playing
  playHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.white,
  },
  playQuestion: { fontSize: theme.fontSizes.md, fontWeight: '700', color: theme.colors.black },
  timerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, borderRadius: theme.borderRadius.full,
  },
  timerUrgent: { backgroundColor: theme.colors.error },
  timerText: { fontSize: theme.fontSizes.sm, fontWeight: '800', color: theme.colors.primary },
  progressBar: { height: 4, backgroundColor: theme.colors.lightGray },
  progressFill: { height: '100%', backgroundColor: theme.colors.primary },
  playContent: { padding: theme.spacing.md, alignItems: 'center' },
  instruction: { fontSize: theme.fontSizes.sm, color: theme.colors.gray, marginBottom: theme.spacing.md },
  // Matrix
  matrixContainer: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: theme.spacing.sm,
    ...theme.shadows.md, marginBottom: theme.spacing.lg, borderWidth: 2, borderColor: theme.colors.cardBorder,
  },
  matrixRow: { flexDirection: 'row' },
  matrixCell: { padding: 4, borderWidth: 0.5, borderColor: theme.colors.lightGray },
  matrixCellMissing: {
    width: 80, height: 80, alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primary + '08',
  },
  matrixQuestionMark: { fontSize: 36, fontWeight: '900', color: theme.colors.primary },
  // Options
  optionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: theme.spacing.sm, width: '100%',
  },
  optionCard: {
    alignItems: 'center', padding: theme.spacing.sm, borderRadius: theme.borderRadius.md,
    borderWidth: 2, width: '30%', ...theme.shadows.sm,
  },
  optionLabel: { fontSize: theme.fontSizes.sm, fontWeight: '800', color: theme.colors.darkGray, marginBottom: 4 },
  // Result
  resultContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
  resultMainTitle: { fontSize: theme.fontSizes.xxl, fontWeight: '800', color: theme.colors.black, marginBottom: theme.spacing.lg },
  resultCircle: {
    width: 130, height: 130, borderRadius: 65, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md,
  },
  resultScore: { fontSize: 42, fontWeight: '900', color: theme.colors.white },
  resultLabel: { fontSize: theme.fontSizes.sm, color: 'rgba(255,255,255,0.8)' },
  ratingBadge: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm, borderRadius: theme.borderRadius.full, marginBottom: theme.spacing.md },
  ratingText: { fontSize: theme.fontSizes.lg, fontWeight: '800' },
  resultPct: { fontSize: theme.fontSizes.md, color: theme.colors.gray, marginBottom: theme.spacing.xs },
  resultTime: { fontSize: theme.fontSizes.sm, color: theme.colors.mediumGray, marginBottom: theme.spacing.xl },
  resultActions: { width: '100%', gap: theme.spacing.sm },
});
