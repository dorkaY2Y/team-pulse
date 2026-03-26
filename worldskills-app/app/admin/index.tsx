import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import { theme } from '../../lib/theme';

interface DashboardStats {
  totalUsers: number;
  totalTests: number;
  totalResults: number;
  avgScore: number;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalTests: 0,
    totalResults: 0,
    avgScore: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [recentResults, setRecentResults] = useState<any[]>([]);

  async function fetchStats() {
    const [usersRes, testsRes, resultsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'competitor'),
      supabase.from('tests').select('id', { count: 'exact', head: true }),
      supabase.from('test_results').select('percentage'),
    ]);

    const results = resultsRes.data || [];
    const avgScore = results.length > 0
      ? Math.round(results.reduce((sum: number, r: any) => sum + r.percentage, 0) / results.length)
      : 0;

    setStats({
      totalUsers: usersRes.count || 0,
      totalTests: testsRes.count || 0,
      totalResults: results.length,
      avgScore,
    });

    // Fetch recent results
    const { data: recent } = await supabase
      .from('test_results')
      .select('*, profiles:user_id(full_name)')
      .order('completed_at', { ascending: false })
      .limit(5);

    setRecentResults(recent || []);
  }

  useEffect(() => {
    fetchStats();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {/* Admin header */}
        <View style={styles.header}>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={16} color={theme.colors.primary} />
            <Text style={styles.adminBadgeText}>Admin</Text>
          </View>
          <Text style={styles.greeting}>Szia, {profile?.full_name || 'Admin'}!</Text>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#0077C8" />
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Versenyző</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="clipboard" size={24} color="#00A651" />
            <Text style={styles.statValue}>{stats.totalTests}</Text>
            <Text style={styles.statLabel}>Teszt</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
            <Text style={styles.statValue}>{stats.totalResults}</Text>
            <Text style={styles.statLabel}>Kitöltés</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={24} color="#FFB81C" />
            <Text style={styles.statValue}>{stats.avgScore}%</Text>
            <Text style={styles.statLabel}>Átlag</Text>
          </View>
        </View>

        {/* Recent activity */}
        <Header title="Legutóbbi eredmények" />

        <View style={styles.recentList}>
          {recentResults.length === 0 ? (
            <Text style={styles.emptyText}>Még nincs eredmény.</Text>
          ) : (
            recentResults.map((result, i) => (
              <View key={result.id || i} style={styles.recentItem}>
                <View style={styles.recentAvatar}>
                  <Text style={styles.recentAvatarText}>
                    {result.profiles?.full_name?.charAt(0) || '?'}
                  </Text>
                </View>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName}>
                    {result.profiles?.full_name || 'Ismeretlen'}
                  </Text>
                  <Text style={styles.recentDate}>
                    {new Date(result.completed_at).toLocaleDateString('hu-HU')}
                  </Text>
                </View>
                <Text style={[
                  styles.recentScore,
                  { color: result.percentage >= 80 ? theme.colors.success : result.percentage >= 50 ? theme.colors.warning : theme.colors.error }
                ]}>
                  {Math.round(result.percentage)}%
                </Text>
              </View>
            ))
          )}
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
  header: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: theme.spacing.xs,
  },
  adminBadgeText: {
    fontSize: theme.fontSizes.xs,
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  greeting: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: '800',
    color: theme.colors.black,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
    flexGrow: 1,
  },
  statValue: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: '800',
    color: theme.colors.black,
    marginTop: theme.spacing.sm,
  },
  statLabel: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  recentList: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.gray,
    fontSize: theme.fontSizes.md,
    paddingVertical: theme.spacing.xl,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  recentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  recentAvatarText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: theme.fontSizes.md,
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: theme.fontSizes.md,
    fontWeight: '600',
    color: theme.colors.black,
  },
  recentDate: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.mediumGray,
  },
  recentScore: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '800',
  },
});
