import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { getMyResults, TestResult } from '../../lib/results';
import { theme } from '../../lib/theme';
import { useFocusEffect } from 'expo-router';

const TEST_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  iq: { icon: 'bulb-outline', color: '#0084AD' },
  attention: { icon: 'scan-outline', color: '#0077C8' },
  concentration_stroop: { icon: 'color-palette-outline', color: '#0077C8' },
  concentration_sequence: { icon: 'grid-outline', color: '#0077C8' },
  concentration_reaction: { icon: 'flash-outline', color: '#D51067' },
  concentration_schulte: { icon: 'apps-outline', color: '#0084AD' },
  concentration_pairs: { icon: 'copy-outline', color: '#FF6C0C' },
  concentration_numberHunt: { icon: 'search-outline', color: '#4A0D66' },
  mindset: { icon: 'analytics-outline', color: '#4A0D66' },
  goals: { icon: 'flag-outline', color: '#FF6C0C' },
  quiz: { icon: 'help-circle-outline', color: '#003764' },
};

function getScoreColor(pct: number): string {
  if (pct >= 80) return '#0084AD';
  if (pct >= 50) return '#FF6C0C';
  return '#D51067';
}

export default function ResultsScreen() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const data = await getMyResults();
    setResults(data);
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        <Header title="Eredmények" subtitle="Korábbi tesztjeid" />

        {results.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="clipboard-outline" size={48} color={theme.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Még nincs eredményed</Text>
            <Text style={styles.emptySubtitle}>
              Töltsd ki az első tesztedet, és itt fogod{'\n'}látni az összes korábbi eredményedet!
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {/* Summary stats */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{results.length}</Text>
                <Text style={styles.summaryLabel}>teszt</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>
                  {Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)}%
                </Text>
                <Text style={styles.summaryLabel}>átlag</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>
                  {Math.max(...results.map((r) => r.percentage))}%
                </Text>
                <Text style={styles.summaryLabel}>legjobb</Text>
              </View>
            </View>
            {results.map((result) => {
              const testInfo = TEST_ICONS[result.testType] || { icon: 'help-outline' as const, color: theme.colors.gray };
              return (
                <View key={result.id} style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <Ionicons name={testInfo.icon} size={20} color={testInfo.color} />
                    <Text style={styles.resultTitle} numberOfLines={1}>{result.testLabel}</Text>
                    {result.mode === 'selection' && (
                      <View style={styles.selectionBadge}>
                        <Text style={styles.selectionBadgeText}>Kiválasztás</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.resultBody}>
                    <View style={[styles.scoreCircle, { backgroundColor: getScoreColor(result.percentage) + '15' }]}>
                      <Text style={[styles.scoreText, { color: getScoreColor(result.percentage) }]}>
                        {result.percentage}%
                      </Text>
                    </View>
                    <View style={styles.resultDetails}>
                      <Text style={styles.detailText}>
                        Pontszám: {result.score}/{result.maxScore}
                      </Text>
                      {result.timeTakenSeconds != null && (
                        <Text style={styles.detailText}>
                          Idő: {Math.floor(result.timeTakenSeconds / 60)}:{String(result.timeTakenSeconds % 60).padStart(2, '0')}
                        </Text>
                      )}
                      <Text style={styles.dateText}>
                        {new Date(result.completedAt).toLocaleDateString('hu-HU', {
                          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  empty: { alignItems: 'center', paddingTop: theme.spacing.xxl * 2, paddingHorizontal: theme.spacing.xl },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: theme.colors.primary + '12',
    alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md,
  },
  emptyTitle: { fontSize: theme.fontSizes.xl, fontWeight: '800', color: theme.colors.black, marginTop: theme.spacing.sm },
  emptySubtitle: { fontSize: theme.fontSizes.md, color: theme.colors.gray, marginTop: theme.spacing.sm, textAlign: 'center', lineHeight: 22 },
  summaryRow: {
    flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.lg,
  },
  summaryCard: {
    flex: 1, backgroundColor: theme.colors.navy, borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md, alignItems: 'center', ...theme.shadows.md,
  },
  summaryValue: { fontSize: theme.fontSizes.xl, fontWeight: '900', color: theme.colors.white },
  summaryLabel: { fontSize: theme.fontSizes.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  list: { paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.xl },
  resultCard: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, marginBottom: theme.spacing.sm, ...theme.shadows.sm,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm, gap: theme.spacing.sm },
  resultTitle: { fontSize: theme.fontSizes.md, fontWeight: '700', color: theme.colors.black, flex: 1 },
  selectionBadge: {
    backgroundColor: theme.colors.primary + '15', paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2, borderRadius: theme.borderRadius.full,
  },
  selectionBadgeText: { fontSize: 10, fontWeight: '700', color: theme.colors.primary, textTransform: 'uppercase' },
  resultBody: { flexDirection: 'row', alignItems: 'center' },
  scoreCircle: {
    width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md,
  },
  scoreText: { fontSize: theme.fontSizes.lg, fontWeight: '800' },
  resultDetails: { flex: 1 },
  detailText: { fontSize: theme.fontSizes.sm, color: theme.colors.darkGray },
  dateText: { fontSize: theme.fontSizes.xs, color: theme.colors.mediumGray, marginTop: theme.spacing.xs },
});
