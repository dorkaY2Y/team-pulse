import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getLocalProfile, clearLocalProfile, LocalProfile } from '../../lib/storage';
import { Button } from '../../components/Button';
import { theme } from '../../lib/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<LocalProfile | null>(null);

  useEffect(() => {
    getLocalProfile().then(setProfile);
  }, []);

  function handleReset() {
    Alert.alert(
      'Profil törlése',
      'Biztosan törölni szeretnéd a profilod? Visszakerülsz a kezdőoldalra.',
      [
        { text: 'Mégsem', style: 'cancel' },
        {
          text: 'Törlés',
          style: 'destructive',
          onPress: async () => {
            await clearLocalProfile();
            router.replace('/onboarding');
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>
              {profile?.name?.charAt(0)?.toUpperCase() || 'V'}
            </Text>
          </View>
          <Text style={styles.name}>{profile?.name || 'Versenyző'}</Text>
          {profile?.skill && (
            <View style={styles.skillBadge}>
              <Ionicons name="construct-outline" size={14} color={theme.colors.primary} />
              <Text style={styles.skillText}>{profile.skill}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Név</Text>
              <Text style={styles.infoValue}>{profile?.name || '—'}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="construct-outline" size={20} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Szakma</Text>
              <Text style={styles.infoValue}>{profile?.skill || '—'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Profil módosítása"
            onPress={() => router.push('/onboarding')}
            variant="outline"
          />
          <Button
            title="Profil törlése és újrakezdés"
            onPress={handleReset}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    backgroundColor: theme.colors.white, alignItems: 'center',
    paddingVertical: theme.spacing.xl, borderBottomWidth: 1, borderBottomColor: theme.colors.lightGray,
  },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md,
  },
  avatarText: { color: theme.colors.white, fontSize: theme.fontSizes.hero, fontWeight: '700' },
  name: { fontSize: theme.fontSizes.xl, fontWeight: '800', color: theme.colors.black },
  skillBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primary + '15', paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs, borderRadius: theme.borderRadius.full,
  },
  skillText: { color: theme.colors.primary, fontSize: theme.fontSizes.sm, fontWeight: '700' },
  infoSection: { padding: theme.spacing.md, gap: theme.spacing.sm },
  infoCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md, padding: theme.spacing.md, ...theme.shadows.sm,
  },
  infoContent: { marginLeft: theme.spacing.md },
  infoLabel: { fontSize: theme.fontSizes.xs, color: theme.colors.mediumGray, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: theme.fontSizes.md, color: theme.colors.black, fontWeight: '600', marginTop: 2 },
  actions: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl, gap: theme.spacing.sm },
});
