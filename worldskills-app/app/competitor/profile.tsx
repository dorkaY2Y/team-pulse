import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Text, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getLocalProfile, clearLocalProfile, LocalProfile } from '../../lib/storage';
import { getMyResults, clearLocalResults, TestResult } from '../../lib/results';
import { Button } from '../../components/Button';
import { theme } from '../../lib/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [resultCount, setResultCount] = useState(0);

  useFocusEffect(useCallback(() => {
    getLocalProfile().then(setProfile);
    getMyResults().then((r) => setResultCount(r.length));
  }, []));

  function handleReset() {
    Alert.alert(
      'Profil törlése',
      'Biztosan törölni szeretnéd a profilod és az összes eredményed? Visszakerülsz a kezdőoldalra.',
      [
        { text: 'Mégsem', style: 'cancel' },
        {
          text: 'Törlés',
          style: 'destructive',
          onPress: async () => {
            await clearLocalProfile();
            await clearLocalResults();
            router.replace('/onboarding');
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero header */}
        <View style={styles.header}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarText}>
                {profile?.name?.charAt(0)?.toUpperCase() || 'V'}
              </Text>
            </View>
          </View>
          <Text style={styles.name}>{profile?.name || 'Versenyző'}</Text>
          {profile?.skill && (
            <View style={styles.skillBadge}>
              <Ionicons name="construct-outline" size={14} color={theme.colors.white} />
              <Text style={styles.skillText}>{profile.skill}</Text>
            </View>
          )}

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{resultCount}</Text>
              <Text style={styles.statLabel}>teszt</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.skill ? '1' : '0'}</Text>
              <Text style={styles.statLabel}>szakma</Text>
            </View>
          </View>
        </View>

        {/* Info cards */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Adatok</Text>

          <View style={styles.infoCard}>
            <View style={[styles.infoIcon, { backgroundColor: '#0084AD15' }]}>
              <Ionicons name="person-outline" size={20} color="#0084AD" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Név</Text>
              <Text style={styles.infoValue}>{profile?.name || '—'}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={[styles.infoIcon, { backgroundColor: '#FF6C0C15' }]}>
              <Ionicons name="construct-outline" size={20} color="#FF6C0C" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Szakma</Text>
              <Text style={styles.infoValue}>{profile?.skill || '—'}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Text style={styles.sectionTitle}>Műveletek</Text>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/admin')}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.colors.primary + '15' }]}>
              <Ionicons name="bar-chart-outline" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Admin felület</Text>
              <Text style={styles.actionDesc}>Összes eredmény megtekintése</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.mediumGray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/onboarding')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#0084AD15' }]}>
              <Ionicons name="create-outline" size={20} color="#0084AD" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Profil módosítása</Text>
              <Text style={styles.actionDesc}>Név vagy szakma módosítása</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.mediumGray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, styles.actionRowDanger]}
            onPress={handleReset}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#D5106715' }]}>
              <Ionicons name="trash-outline" size={20} color="#D51067" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: '#D51067' }]}>Profil törlése</Text>
              <Text style={styles.actionDesc}>Újrakezdés az elejéről</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.mediumGray} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    backgroundColor: theme.colors.navy, alignItems: 'center',
    paddingTop: theme.spacing.xl, paddingBottom: theme.spacing.lg,
  },
  avatarRing: {
    width: 92, height: 92, borderRadius: 46, borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center',
    justifyContent: 'center', marginBottom: theme.spacing.md,
  },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: theme.colors.white, fontSize: 32, fontWeight: '800' },
  name: { fontSize: theme.fontSizes.xl, fontWeight: '800', color: theme.colors.white },
  skillBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: theme.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs, borderRadius: theme.borderRadius.full,
  },
  skillText: { color: theme.colors.white, fontSize: theme.fontSizes.sm, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.xl,
  },
  statItem: { alignItems: 'center', paddingHorizontal: theme.spacing.lg },
  statValue: { fontSize: theme.fontSizes.xl, fontWeight: '900', color: theme.colors.white },
  statLabel: { fontSize: theme.fontSizes.xs, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },
  // Info
  infoSection: { padding: theme.spacing.md },
  sectionTitle: {
    fontSize: theme.fontSizes.xs, fontWeight: '700', color: theme.colors.mediumGray,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: theme.spacing.sm,
  },
  infoCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg, padding: theme.spacing.md,
    marginBottom: theme.spacing.sm, ...theme.shadows.sm,
  },
  infoIcon: {
    width: 40, height: 40, borderRadius: theme.borderRadius.md,
    alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: theme.fontSizes.xs, color: theme.colors.mediumGray, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: theme.fontSizes.md, color: theme.colors.black, fontWeight: '600', marginTop: 2 },
  // Actions
  actions: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg, padding: theme.spacing.md,
    marginBottom: theme.spacing.sm, ...theme.shadows.sm,
  },
  actionRowDanger: {},
  actionIcon: {
    width: 40, height: 40, borderRadius: theme.borderRadius.md,
    alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md,
  },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: theme.fontSizes.md, fontWeight: '600', color: theme.colors.black },
  actionDesc: { fontSize: theme.fontSizes.xs, color: theme.colors.gray, marginTop: 2 },
});
