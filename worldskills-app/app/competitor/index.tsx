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
    subtitle: 'Stroop, memória, reakcióidő',
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
        {/* Header with name + skill */}
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

        {/* Two mode cards */}
        <View style={styles.modeSection}>
          <Text style={styles.sectionLabel}>Válassz módot</Text>

          <TouchableOpacity
            style={[styles.modeCard, styles.modeCardSelection]}
            onPress={() => router.push('/competitor/selection' as any)}
          >
            <View style={styles.modeIconContainer}>
              <Ionicons name="timer-outline" size={28} color={theme.colors.white} />
            </View>
            <View style={styles.modeInfo}>
              <Text style={styles.modeTitle}>Mentális Kiválasztás</Text>
              <Text style={styles.modeDesc}>
                Összes teszt egymás után, időre. Ha végeztél egy feladattal, üsd le a timert!
              </Text>
              <Text style={styles.modeDuration}>~30 perc</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeCard, styles.modeCardPractice]}
            onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            <View style={[styles.modeIconContainer, { backgroundColor: theme.colors.teal }]}>
              <Ionicons name="school-outline" size={28} color={theme.colors.white} />
            </View>
            <View style={styles.modeInfo}>
              <Text style={styles.modeTitleDark}>Gyakorlás</Text>
              <Text style={styles.modeDescDark}>
                Válassz egy tesztet és gyakorolj nyomás nélkül, időlimit nélkül.
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={theme.colors.gray} />
          </TouchableOpacity>
        </View>

        {/* Individual tests for practice */}
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  // Header
  header: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: theme.fontSizes.sm,
    color: 'rgba(255,255,255,0.6)',
  },
  name: {
    fontSize: theme.fontSizes.xl,
    fontWeight: '800',
    color: theme.colors.white,
    marginTop: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.lg,
    fontWeight: '700',
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    marginTop: theme.spacing.sm,
  },
  skillText: {
    fontSize: theme.fontSizes.xs,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  // Mode cards
  modeSection: {
    padding: theme.spacing.md,
  },
  sectionLabel: {
    fontSize: theme.fontSizes.xs,
    fontWeight: '700',
    color: theme.colors.mediumGray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.md,
  },
  modeCardSelection: {
    backgroundColor: theme.colors.primary,
  },
  modeCardPractice: {
    backgroundColor: theme.colors.white,
  },
  modeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  modeInfo: {
    flex: 1,
  },
  modeTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '700',
    color: theme.colors.white,
  },
  modeDesc: {
    fontSize: theme.fontSizes.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    lineHeight: 18,
  },
  modeTitleDark: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '700',
    color: theme.colors.black,
  },
  modeDescDark: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.gray,
    marginTop: 2,
    lineHeight: 18,
  },
  modeDuration: {
    fontSize: theme.fontSizes.xs,
    fontWeight: '700',
    color: theme.colors.yellow,
    marginTop: 4,
  },
  // Tests section
  testsSection: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
});
