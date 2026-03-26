import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { useAuth } from '../../lib/auth-context';
import { theme } from '../../lib/theme';

const TEST_CATEGORIES = [
  {
    id: 'mindset',
    title: 'Fejlődési Szemlélet',
    subtitle: 'Growth Mindset kérdőív',
    icon: 'analytics-outline' as const,
    color: '#4A0D66',
    route: '/competitor/tests/mindset',
  },
  {
    id: 'goals',
    title: 'Célorientáció',
    subtitle: 'Viszonyító és elsajátítási célok',
    icon: 'flag-outline' as const,
    color: '#FF6C0C',
    route: '/competitor/tests/goals',
  },
  {
    id: 'concentration',
    title: 'Koncentráció',
    subtitle: 'Figyelmi és reakcióidő tesztek',
    icon: 'eye-outline' as const,
    color: '#0077C8',
    route: '/competitor/tests/concentration',
  },
  {
    id: 'iq',
    title: 'IQ Teszt',
    subtitle: 'Logikai gondolkodás és mintázatfelismerés',
    icon: 'bulb-outline' as const,
    color: '#0084AD',
    route: '/competitor/tests/iq',
  },
  {
    id: 'multiple_choice',
    title: 'Feleletválasztós',
    subtitle: 'Tudásfelmérő kérdéssorok',
    icon: 'list-outline' as const,
    color: '#D51067',
    route: '/competitor/tests/quiz',
  },
];

export default function CompetitorDashboard() {
  const { profile } = useAuth();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Welcome header */}
        <View style={styles.welcomeContainer}>
          <View style={styles.welcomeRow}>
            <View>
              <Text style={styles.greeting}>Üdvözöljük!</Text>
              <Text style={styles.name}>{profile?.full_name || 'Versenyző'}</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'V'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Kitöltött</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statLabel}>Átlag %</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statLabel}>Legjobb</Text>
          </View>
        </View>

        {/* Test categories */}
        <Header title="Tesztek" subtitle="Válassz egy kategóriát" />

        <View style={styles.cards}>
          {TEST_CATEGORIES.map((cat) => (
            <Card
              key={cat.id}
              title={cat.title}
              subtitle={cat.subtitle}
              icon={cat.icon}
              iconColor={cat.color}
              onPress={() => router.push(cat.route as any)}
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
  welcomeContainer: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.gray,
  },
  name: {
    fontSize: theme.fontSizes.xl,
    fontWeight: '800',
    color: theme.colors.black,
    marginTop: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.lg,
    fontWeight: '700',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSizes.xl,
    fontWeight: '800',
    color: theme.colors.black,
  },
  statLabel: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.gray,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.lightGray,
  },
  cards: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
});
