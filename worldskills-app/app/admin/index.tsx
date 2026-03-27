import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { getLocalResults, getAllResultsFromSupabase, TestResult } from '../../lib/results';
import { theme } from '../../lib/theme';

function getScoreColor(pct: number): string {
  if (pct >= 80) return '#0084AD';
  if (pct >= 50) return '#FF6C0C';
  return '#D51067';
}

export default function AdminDashboard() {
  const router = useRouter();
  const [results, setResults] = useState<TestResult[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [source, setSource] = useState<'local' | 'supabase'>('local');

  async function load() {
    let data: TestResult[];
    if (source === 'supabase') {
      data = await getAllResultsFromSupabase();
      // Fallback to local if Supabase returns nothing
      if (data.length === 0) data = await getLocalResults();
    } else {
      data = await getLocalResults();
    }
    setResults(data);
  }

  useFocusEffect(useCallback(() => { load(); }, [source]));

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  // Get unique skills
  const skills = [...new Set(results.map((r) => r.skill))].sort();

  // Filter by selected skill
  const filteredResults = selectedSkill
    ? results.filter((r) => r.skill === selectedSkill)
    : results;

  // Group by person
  const byPerson: Record<string, TestResult[]> = {};
  filteredResults.forEach((r) => {
    if (!byPerson[r.name]) byPerson[r.name] = [];
    byPerson[r.name].push(r);
  });

  // Stats
  const totalPeople = new Set(filteredResults.map((r) => r.name)).size;
  const totalTests = filteredResults.length;
  const avgScore = totalTests > 0
    ? Math.round(filteredResults.reduce((s, r) => s + r.percentage, 0) / totalTests)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={theme.colors.white} />
            </TouchableOpacity>
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={14} color={theme.colors.white} />
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          </View>
          <Text style={styles.headerTitle}>Eredmények</Text>
          <Text style={styles.headerSubtitle}>Összes versenyző teljesítménye</Text>
        </View>

        {/* Source toggle */}
        <View style={styles.sourceRow}>
          <TouchableOpacity
            style={[styles.sourceBtn, source === 'local' && styles.sourceBtnActive]}
            onPress={() => setSource('local')}
          >
            <Text style={[styles.sourceBtnText, source === 'local' && styles.sourceBtnTextActive]}>Lokális</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sourceBtn, source === 'supabase' && styles.sourceBtnActive]}
            onPress={() => setSource('supabase')}
          >
            <Text style={[styles.sourceBtnText, source === 'supabase' && styles.sourceBtnTextActive]}>Supabase</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalPeople}</Text>
            <Text style={styles.statLabel}>Versenyző</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalTests}</Text>
            <Text style={styles.statLabel}>Kitöltés</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{avgScore}%</Text>
            <Text style={styles.statLabel}>Átlag</Text>
          </View>
        </View>

        {/* Skill filter */}
        <View style={styles.skillFilter}>
          <Text style={styles.filterLabel}>Szűrés szakma szerint</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.skillChips}>
            <TouchableOpacity
              style={[styles.skillChip, !selectedSkill && styles.skillChipActive]}
              onPress={() => setSelectedSkill(null)}
            >
              <Text style={[styles.skillChipText, !selectedSkill && styles.skillChipTextActive]}>Mind</Text>
            </TouchableOpacity>
            {skills.map((skill) => (
              <TouchableOpacity
                key={skill}
                style={[styles.skillChip, selectedSkill === skill && styles.skillChipActive]}
                onPress={() => setSelectedSkill(skill)}
              >
                <Text style={[styles.skillChipText, selectedSkill === skill && styles.skillChipTextActive]}>
                  {skill}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Results by person */}
        <View style={styles.resultsList}>
          {Object.entries(byPerson).length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={40} color={theme.colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Még nincs eredmény</Text>
              <Text style={styles.emptyText}>Ha a versenyzők kitöltik a teszteket, itt fogod látni az eredményeiket.</Text>
            </View>
          ) : (
            Object.entries(byPerson).map(([name, personResults]) => {
              const skill = personResults[0]?.skill || '';
              const personAvg = Math.round(personResults.reduce((s, r) => s + r.percentage, 0) / personResults.length);

              return (
                <View key={name} style={styles.personCard}>
                  <View style={styles.personHeader}>
                    <View style={styles.personAvatar}>
                      <Text style={styles.personAvatarText}>{name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.personInfo}>
                      <Text style={styles.personName}>{name}</Text>
                      <Text style={styles.personSkill}>{skill}</Text>
                    </View>
                    <View style={[styles.avgBadge, { backgroundColor: getScoreColor(personAvg) + '15' }]}>
                      <Text style={[styles.avgBadgeText, { color: getScoreColor(personAvg) }]}>{personAvg}%</Text>
                    </View>
                  </View>

                  {personResults.map((r) => (
                    <View key={r.id} style={styles.testRow}>
                      <Text style={styles.testLabel}>{r.testLabel}</Text>
                      <Text style={[styles.testScore, { color: getScoreColor(r.percentage) }]}>
                        {r.percentage}%
                      </Text>
                      {r.timeTakenSeconds != null && (
                        <Text style={styles.testTime}>
                          {Math.floor(r.timeTakenSeconds / 60)}:{String(r.timeTakenSeconds % 60).padStart(2, '0')}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.lg,
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  backBtn: { padding: theme.spacing.xs },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4, borderRadius: theme.borderRadius.full,
  },
  adminBadgeText: { fontSize: theme.fontSizes.xs, fontWeight: '700', color: theme.colors.white, textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: theme.fontSizes.xxl, fontWeight: '800', color: theme.colors.white },
  headerSubtitle: { fontSize: theme.fontSizes.sm, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  // Source toggle
  sourceRow: { flexDirection: 'row', padding: theme.spacing.md, gap: theme.spacing.sm },
  sourceBtn: {
    flex: 1, paddingVertical: theme.spacing.sm, borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.card, alignItems: 'center', borderWidth: 1.5, borderColor: theme.colors.lightGray,
  },
  sourceBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  sourceBtnText: { fontSize: theme.fontSizes.sm, fontWeight: '600', color: theme.colors.gray },
  sourceBtnTextActive: { color: theme.colors.white },
  // Stats
  statsRow: { flexDirection: 'row', paddingHorizontal: theme.spacing.md, gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  statCard: { flex: 1, backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, alignItems: 'center', ...theme.shadows.sm },
  statValue: { fontSize: theme.fontSizes.xl, fontWeight: '800', color: theme.colors.black },
  statLabel: { fontSize: theme.fontSizes.xs, color: theme.colors.gray, textTransform: 'uppercase', marginTop: 2 },
  // Skill filter
  skillFilter: { paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.md },
  filterLabel: { fontSize: theme.fontSizes.xs, fontWeight: '700', color: theme.colors.mediumGray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: theme.spacing.sm },
  skillChips: { gap: theme.spacing.xs },
  skillChip: {
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.card, borderWidth: 1.5, borderColor: theme.colors.lightGray,
  },
  skillChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  skillChipText: { fontSize: theme.fontSizes.sm, color: theme.colors.gray },
  skillChipTextActive: { color: theme.colors.white, fontWeight: '700' },
  // Empty
  empty: { alignItems: 'center', paddingVertical: theme.spacing.xxl, paddingHorizontal: theme.spacing.xl },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.primary + '12',
    alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md,
  },
  emptyTitle: { fontSize: theme.fontSizes.lg, fontWeight: '700', color: theme.colors.black, marginBottom: theme.spacing.xs },
  emptyText: { color: theme.colors.gray, fontSize: theme.fontSizes.sm, textAlign: 'center', lineHeight: 22 },
  // Results list
  resultsList: { paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  personCard: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, marginBottom: theme.spacing.sm, ...theme.shadows.sm,
  },
  personHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm, paddingBottom: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.lightGray },
  personAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md,
  },
  personAvatarText: { color: theme.colors.white, fontWeight: '700', fontSize: theme.fontSizes.md },
  personInfo: { flex: 1 },
  personName: { fontSize: theme.fontSizes.md, fontWeight: '700', color: theme.colors.black },
  personSkill: { fontSize: theme.fontSizes.xs, color: theme.colors.gray },
  avgBadge: { paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, borderRadius: theme.borderRadius.full },
  avgBadgeText: { fontSize: theme.fontSizes.sm, fontWeight: '800' },
  testRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.xs },
  testLabel: { flex: 1, fontSize: theme.fontSizes.sm, color: theme.colors.darkGray },
  testScore: { fontSize: theme.fontSizes.sm, fontWeight: '700', marginRight: theme.spacing.md },
  testTime: { fontSize: theme.fontSizes.xs, color: theme.colors.mediumGray, width: 40, textAlign: 'right' },
});
