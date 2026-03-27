import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getLocalResults, getAllResultsFromSupabase, TestResult } from '../../lib/results';
import { theme } from '../../lib/theme';

const TEST_SHORT_NAMES: Record<string, string> = {
  iq: 'IQ',
  attention: 'Figyelem',
  concentration_stroop: 'Stroop',
  concentration_sequence: 'Memória',
  concentration_reaction: 'Reakció',
  concentration_schulte: 'Schulte',
  concentration_pairs: 'Párok',
  concentration_numberHunt: 'Vadász',
  mindset: 'Szemlélet',
  goals: 'Célok',
  quiz: 'Kvíz',
};

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

  // Get unique skills with counts
  const skillCounts: Record<string, number> = {};
  results.forEach((r) => {
    const s = r.skill || 'Ismeretlen';
    skillCounts[s] = (skillCounts[s] || 0) + 1;
  });
  const skills = Object.keys(skillCounts).sort();

  // Filter by selected skill
  const filteredResults = selectedSkill
    ? results.filter((r) => (r.skill || 'Ismeretlen') === selectedSkill)
    : results;

  // Group by person
  const byPerson: Record<string, TestResult[]> = {};
  filteredResults.forEach((r) => {
    const key = r.name || 'Ismeretlen';
    if (!byPerson[key]) byPerson[key] = [];
    byPerson[key].push(r);
  });

  // Stats
  const totalPeople = new Set(filteredResults.map((r) => r.name)).size;
  const totalTests = filteredResults.length;
  const avgScore = totalTests > 0
    ? Math.round(filteredResults.reduce((s, r) => s + r.percentage, 0) / totalTests)
    : 0;

  // Get all unique test types for comparison table header
  const allTestTypes = [...new Set(filteredResults.map((r) => r.testType))];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.white} />}
      >
        {/* Header */}
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
          <Text style={styles.headerSubtitle}>
            {selectedSkill ? `${selectedSkill} – versenyzők összehasonlítása` : 'Válassz szakmát a versenyzők megtekintéséhez'}
          </Text>
        </View>

        {/* Source toggle */}
        <View style={styles.sourceRow}>
          <TouchableOpacity
            style={[styles.sourceBtn, source === 'local' && styles.sourceBtnActive]}
            onPress={() => setSource('local')}
          >
            <Ionicons name="phone-portrait-outline" size={16} color={source === 'local' ? theme.colors.white : theme.colors.gray} />
            <Text style={[styles.sourceBtnText, source === 'local' && styles.sourceBtnTextActive]}>Lokális</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sourceBtn, source === 'supabase' && styles.sourceBtnActive]}
            onPress={() => setSource('supabase')}
          >
            <Ionicons name="cloud-outline" size={16} color={source === 'supabase' ? theme.colors.white : theme.colors.gray} />
            <Text style={[styles.sourceBtnText, source === 'supabase' && styles.sourceBtnTextActive]}>Supabase</Text>
          </TouchableOpacity>
        </View>

        {/* Skill selector - primary navigation */}
        <View style={styles.skillSection}>
          <Text style={styles.sectionTitle}>Szakma kiválasztása</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.skillChips}>
            <TouchableOpacity
              style={[styles.skillChip, !selectedSkill && styles.skillChipActive]}
              onPress={() => setSelectedSkill(null)}
            >
              <Text style={[styles.skillChipText, !selectedSkill && styles.skillChipTextActive]}>
                Összes ({results.length})
              </Text>
            </TouchableOpacity>
            {skills.map((skill) => (
              <TouchableOpacity
                key={skill}
                style={[styles.skillChip, selectedSkill === skill && styles.skillChipActive]}
                onPress={() => setSelectedSkill(skill)}
              >
                <Text style={[styles.skillChipText, selectedSkill === skill && styles.skillChipTextActive]}>
                  {skill} ({skillCounts[skill]})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={20} color={theme.colors.primary} />
            <Text style={styles.statValue}>{totalPeople}</Text>
            <Text style={styles.statLabel}>versenyző</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="clipboard" size={20} color={theme.colors.teal} />
            <Text style={styles.statValue}>{totalTests}</Text>
            <Text style={styles.statLabel}>kitöltés</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={20} color={theme.colors.orange} />
            <Text style={styles.statValue}>{avgScore}%</Text>
            <Text style={styles.statLabel}>átlag</Text>
          </View>
        </View>

        {/* Results by person */}
        <View style={styles.resultsList}>
          {Object.entries(byPerson).length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={40} color={theme.colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Még nincs eredmény</Text>
              <Text style={styles.emptyText}>
                {selectedSkill
                  ? `Még senki sem töltött ki tesztet a „${selectedSkill}" szakmában.`
                  : 'Ha a versenyzők kitöltik a teszteket, itt fogod látni az eredményeiket.'}
              </Text>
            </View>
          ) : (
            Object.entries(byPerson).map(([name, personResults]) => {
              const skill = personResults[0]?.skill || '';
              const personAvg = Math.round(personResults.reduce((s, r) => s + r.percentage, 0) / personResults.length);

              // Group results by test type, take best result for each
              const bestByType: Record<string, TestResult> = {};
              personResults.forEach((r) => {
                if (!bestByType[r.testType] || r.percentage > bestByType[r.testType].percentage) {
                  bestByType[r.testType] = r;
                }
              });

              return (
                <View key={name} style={styles.personCard}>
                  <View style={styles.personHeader}>
                    <View style={styles.personAvatar}>
                      <Text style={styles.personAvatarText}>{name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.personInfo}>
                      <Text style={styles.personName}>{name}</Text>
                      {!selectedSkill && <Text style={styles.personSkill}>{skill}</Text>}
                    </View>
                    <View style={[styles.avgBadge, { backgroundColor: getScoreColor(personAvg) + '15' }]}>
                      <Text style={[styles.avgBadgeText, { color: getScoreColor(personAvg) }]}>{personAvg}%</Text>
                    </View>
                  </View>

                  {/* Test results grid */}
                  <View style={styles.testGrid}>
                    {Object.entries(bestByType).map(([type, r]) => (
                      <View key={type} style={styles.testCell}>
                        <Text style={styles.testCellLabel}>
                          {TEST_SHORT_NAMES[type] || r.testLabel}
                        </Text>
                        <Text style={[styles.testCellScore, { color: getScoreColor(r.percentage) }]}>
                          {r.percentage}%
                        </Text>
                        {r.timeTakenSeconds != null && (
                          <Text style={styles.testCellTime}>
                            {Math.floor(r.timeTakenSeconds / 60)}:{String(r.timeTakenSeconds % 60).padStart(2, '0')}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>

                  <Text style={styles.personTestCount}>
                    {personResults.length} teszt kitöltve
                  </Text>
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
  // Header
  header: {
    backgroundColor: theme.colors.navy, paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.lg,
    borderBottomLeftRadius: theme.borderRadius.xl, borderBottomRightRadius: theme.borderRadius.xl,
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
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: theme.spacing.sm, borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.card, borderWidth: 1.5, borderColor: theme.colors.lightGray,
  },
  sourceBtnActive: { backgroundColor: theme.colors.navy, borderColor: theme.colors.navy },
  sourceBtnText: { fontSize: theme.fontSizes.sm, fontWeight: '600', color: theme.colors.gray },
  sourceBtnTextActive: { color: theme.colors.white },
  // Skill section
  skillSection: { paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.md },
  sectionTitle: {
    fontSize: theme.fontSizes.xs, fontWeight: '700', color: theme.colors.mediumGray,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: theme.spacing.sm,
  },
  skillChips: { gap: theme.spacing.xs },
  skillChip: {
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.card, borderWidth: 1.5, borderColor: theme.colors.lightGray,
  },
  skillChipActive: { backgroundColor: theme.colors.navy, borderColor: theme.colors.navy },
  skillChipText: { fontSize: theme.fontSizes.sm, color: theme.colors.gray },
  skillChipTextActive: { color: theme.colors.white, fontWeight: '700' },
  // Stats
  statsRow: { flexDirection: 'row', paddingHorizontal: theme.spacing.md, gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  statCard: {
    flex: 1, backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, alignItems: 'center', ...theme.shadows.sm,
  },
  statValue: { fontSize: theme.fontSizes.xl, fontWeight: '800', color: theme.colors.black, marginTop: 4 },
  statLabel: { fontSize: 10, color: theme.colors.gray, textTransform: 'uppercase', marginTop: 2, fontWeight: '600' },
  // Empty
  empty: { alignItems: 'center', paddingVertical: theme.spacing.xxl, paddingHorizontal: theme.spacing.xl },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.primary + '12',
    alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md,
  },
  emptyTitle: { fontSize: theme.fontSizes.lg, fontWeight: '700', color: theme.colors.black, marginBottom: theme.spacing.xs },
  emptyText: { color: theme.colors.gray, fontSize: theme.fontSizes.sm, textAlign: 'center', lineHeight: 22 },
  // Results
  resultsList: { paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  personCard: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, marginBottom: theme.spacing.sm, ...theme.shadows.sm,
  },
  personHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.lightGray,
  },
  personAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.navy,
    alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md,
  },
  personAvatarText: { color: theme.colors.white, fontWeight: '700', fontSize: theme.fontSizes.md },
  personInfo: { flex: 1 },
  personName: { fontSize: theme.fontSizes.md, fontWeight: '700', color: theme.colors.black },
  personSkill: { fontSize: theme.fontSizes.xs, color: theme.colors.gray },
  avgBadge: { paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, borderRadius: theme.borderRadius.full },
  avgBadgeText: { fontSize: theme.fontSizes.sm, fontWeight: '800' },
  // Test grid
  testGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
  testCell: {
    backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs,
    alignItems: 'center', minWidth: 64,
  },
  testCellLabel: { fontSize: 10, color: theme.colors.mediumGray, fontWeight: '600', textTransform: 'uppercase' },
  testCellScore: { fontSize: theme.fontSizes.md, fontWeight: '800', marginTop: 2 },
  testCellTime: { fontSize: 10, color: theme.colors.mediumGray, marginTop: 1 },
  personTestCount: { fontSize: theme.fontSizes.xs, color: theme.colors.mediumGray, marginTop: theme.spacing.sm, textAlign: 'right' },
});
