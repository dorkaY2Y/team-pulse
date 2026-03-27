import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { getLocalProfile, LocalProfile } from '../../lib/storage';
import { theme } from '../../lib/theme';

const TESTS = [
  {
    id: 'iq',
    title: 'IQ Teszt',
    subtitle: 'Progresszív mátrixok • 20 kérdés',
    icon: 'bulb-outline' as const,
    color: '#0084AD',
    route: '/competitor/tests/iq',
    duration: '15 perc',
  },
  {
    id: 'attention',
    title: 'Figyelem Teszt',
    subtitle: 'Bourdon-teszt: 400 szimbólum',
    icon: 'scan-outline' as const,
    color: '#0077C8',
    route: '/competitor/tests/attention',
    duration: '5 perc',
  },
  {
    id: 'concentration',
    title: 'Koncentráció',
    subtitle: 'Stroop, memória, reakcióidő + gyakorlás',
    icon: 'eye-outline' as const,
    color: '#72D0EB',
    route: '/competitor/tests/concentration',
    duration: '5 perc',
  },
  {
    id: 'mindset',
    title: 'Fejlődési Szemlélet',
    subtitle: 'Growth Mindset kérdőív',
    icon: 'analytics-outline' as const,
    color: '#4A0D66',
    route: '/competitor/tests/mindset',
    duration: '3 perc',
  },
  {
    id: 'goals',
    title: 'Célorientáció',
    subtitle: 'Viszonyító és elsajátítási célok',
    icon: 'flag-outline' as const,
    color: '#FF6C0C',
    route: '/competitor/tests/goals',
    duration: '3 perc',
  },
  {
    id: 'quiz',
    title: 'WorldSkills Kvíz',
    subtitle: 'Feleletválasztós tudásfelmérő',
    icon: 'help-circle-outline' as const,
    color: '#003764',
    route: '/competitor/tests/quiz',
    duration: '~5 perc',
  },
];

export default function CompetitorDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    getLocalProfile().then(setProfile);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>Üdvözlünk!</Text>
              <Text style={styles.name}>{profile?.name || 'Versenyző'}</Text>
              {profile?.skill && (
                <View style={styles.skillBadge}>
                  <Ionicons name="construct-outline" size={12} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.skillText}>{profile.skill}</Text>
                </View>
              )}
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.name?.charAt(0)?.toUpperCase() || 'V'}
              </Text>
            </View>
          </View>
        </View>

        {/* Two main action buttons */}
        <View style={styles.actionSection}>
          {/* PRIMARY: Mentális Kiválasztás */}
          <TouchableOpacity
            style={styles.selectionCard}
            onPress={() => router.push('/competitor/selection' as any)}
            activeOpacity={0.85}
          >
            <View style={styles.selectionBadge}>
              <Text style={styles.selectionBadgeText}>HIVATALOS TESZT</Text>
            </View>
            <View style={styles.selectionIconRow}>
              <View style={styles.selectionIcon}>
                <Ionicons name="trophy" size={32} color={theme.colors.white} />
              </View>
            </View>
            <Text style={styles.selectionTitle}>Mentális Kiválasztás</Text>
            <Text style={styles.selectionDesc}>
              Összes teszt egymás után, időre mérve. Ezt válaszd, ha a szakértő kéri!
            </Text>
            <View style={styles.selectionFooter}>
              <View style={styles.selectionInfo}>
                <Ionicons name="time-outline" size={14} color={theme.colors.yellow} />
                <Text style={styles.selectionInfoText}>~30 perc</Text>
              </View>
              <View style={styles.selectionInfo}>
                <Ionicons name="list-outline" size={14} color={theme.colors.yellow} />
                <Text style={styles.selectionInfoText}>5 teszt</Text>
              </View>
              <View style={styles.selectionArrow}>
                <Text style={styles.selectionArrowText}>Indítás</Text>
                <Ionicons name="arrow-forward" size={18} color={theme.colors.white} />
              </View>
            </View>
          </TouchableOpacity>

          {/* SECONDARY: Gyakorlás */}
          <TouchableOpacity
            style={styles.practiceCard}
            onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
            activeOpacity={0.85}
          >
            <View style={styles.practiceLeft}>
              <View style={styles.practiceIcon}>
                <Ionicons name="school-outline" size={24} color={theme.colors.teal} />
              </View>
              <View>
                <Text style={styles.practiceTitle}>Gyakorlás</Text>
                <Text style={styles.practiceDesc}>Tesztek egyenként, nyomás nélkül</Text>
              </View>
            </View>
            <Ionicons name="chevron-down" size={20} color={theme.colors.mediumGray} />
          </TouchableOpacity>
        </View>

        {/* Practice tests */}
        <View style={styles.testsSection}>
          <Text style={styles.sectionLabel}>Tesztek egyenként</Text>
          {TESTS.map((test) => (
            <Card
              key={test.id}
              title={test.title}
              subtitle={`${test.subtitle} • ${test.duration}`}
              icon={test.icon}
              iconColor={test.color}
              onPress={() => router.push(test.route as any)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  // Header
  header: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: theme.fontSizes.sm, color: 'rgba(255,255,255,0.6)' },
  name: { fontSize: theme.fontSizes.xl, fontWeight: '800', color: theme.colors.white, marginTop: 2 },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: theme.colors.white, fontSize: theme.fontSizes.lg, fontWeight: '700' },
  skillBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm, paddingVertical: 4, borderRadius: theme.borderRadius.full,
    marginTop: theme.spacing.sm,
  },
  skillText: { fontSize: theme.fontSizes.xs, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  // Action section
  actionSection: { padding: theme.spacing.md, gap: theme.spacing.sm },
  // Selection card (primary CTA)
  selectionCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  selectionBadge: {
    backgroundColor: theme.colors.magenta,
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.md,
  },
  selectionBadgeText: { color: theme.colors.white, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  selectionIconRow: { marginBottom: theme.spacing.md },
  selectionIcon: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  selectionTitle: { fontSize: theme.fontSizes.xxl, fontWeight: '800', color: theme.colors.white },
  selectionDesc: {
    fontSize: theme.fontSizes.sm, color: 'rgba(255,255,255,0.7)',
    marginTop: theme.spacing.xs, lineHeight: 20,
  },
  selectionFooter: {
    flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.lg, gap: theme.spacing.md,
  },
  selectionInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  selectionInfoText: { fontSize: theme.fontSizes.xs, fontWeight: '600', color: theme.colors.yellow },
  selectionArrow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginLeft: 'auto',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  selectionArrowText: { fontSize: theme.fontSizes.sm, fontWeight: '700', color: theme.colors.white },
  // Practice card (secondary)
  practiceCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.sm,
  },
  practiceLeft: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  practiceIcon: {
    width: 44, height: 44, borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.teal + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  practiceTitle: { fontSize: theme.fontSizes.md, fontWeight: '700', color: theme.colors.black },
  practiceDesc: { fontSize: theme.fontSizes.xs, color: theme.colors.gray, marginTop: 1 },
  // Tests section
  testsSection: { paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  sectionLabel: {
    fontSize: theme.fontSizes.xs, fontWeight: '700', color: theme.colors.mediumGray,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: theme.spacing.sm,
  },
});
