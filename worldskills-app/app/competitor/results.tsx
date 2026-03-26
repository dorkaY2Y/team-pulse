import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import { theme } from '../../lib/theme';

interface TestResult {
  id: string;
  score: number;
  max_score: number;
  percentage: number;
  time_taken_seconds: number | null;
  completed_at: string;
  tests: { title: string; test_categories: { name: string } };
}

export default function ResultsScreen() {
  const { session } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchResults() {
    if (!session?.user) return;

    const { data } = await supabase
      .from('test_results')
      .select('*, tests(title, test_categories(name))')
      .eq('user_id', session.user.id)
      .order('completed_at', { ascending: false });

    setResults((data as any) || []);
  }

  useEffect(() => {
    fetchResults();
  }, [session]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchResults();
    setRefreshing(false);
  }

  function getCategoryIcon(name: string) {
    switch (name) {
      case 'concentration': return 'eye-outline';
      case 'iq': return 'bulb-outline';
      default: return 'list-outline';
    }
  }

  function getScoreColor(pct: number) {
    if (pct >= 80) return theme.colors.success;
    if (pct >= 50) return theme.colors.warning;
    return theme.colors.error;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        <Header title="Eredmények" subtitle="Korábbi tesztjeid eredményei" />

        {results.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={64} color={theme.colors.lightGray} />
            <Text style={styles.emptyTitle}>Még nincs eredményed</Text>
            <Text style={styles.emptySubtitle}>Töltsd ki az első tesztedet!</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {results.map((result) => (
              <View key={result.id} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Ionicons
                    name={getCategoryIcon(result.tests?.test_categories?.name) as any}
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.resultTitle} numberOfLines={1}>
                    {result.tests?.title || 'Teszt'}
                  </Text>
                </View>
                <View style={styles.resultBody}>
                  <View style={styles.scoreCircle}>
                    <Text style={[styles.scoreText, { color: getScoreColor(result.percentage) }]}>
                      {Math.round(result.percentage)}%
                    </Text>
                  </View>
                  <View style={styles.resultDetails}>
                    <Text style={styles.detailText}>
                      Pontszám: {result.score}/{result.max_score}
                    </Text>
                    {result.time_taken_seconds && (
                      <Text style={styles.detailText}>
                        Idő: {Math.floor(result.time_taken_seconds / 60)}:{String(result.time_taken_seconds % 60).padStart(2, '0')}
                      </Text>
                    )}
                    <Text style={styles.dateText}>
                      {new Date(result.completed_at).toLocaleDateString('hu-HU')}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
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
  empty: {
    alignItems: 'center',
    paddingTop: theme.spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '700',
    color: theme.colors.darkGray,
    marginTop: theme.spacing.md,
  },
  emptySubtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.gray,
    marginTop: theme.spacing.xs,
  },
  list: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  resultCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  resultTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: '700',
    color: theme.colors.black,
    flex: 1,
  },
  resultBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  scoreText: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '800',
  },
  resultDetails: {
    flex: 1,
  },
  detailText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.darkGray,
  },
  dateText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.mediumGray,
    marginTop: theme.spacing.xs,
  },
});
