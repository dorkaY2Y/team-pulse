import React from 'react';
import { View, ScrollView, StyleSheet, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useAuth } from '../../lib/auth-context';
import { theme } from '../../lib/theme';

export default function AdminSettings() {
  const { profile, signOut } = useAuth();

  function handleSignOut() {
    Alert.alert(
      'Kijelentkezés',
      'Biztosan ki szeretnél jelentkezni?',
      [
        { text: 'Mégsem', style: 'cancel' },
        { text: 'Kijelentkezés', style: 'destructive', onPress: signOut },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header title="Beállítások" subtitle="Admin felület beállításai" />

        {/* Profile info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profilom</Text>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
              </Text>
            </View>
            <View>
              <Text style={styles.profileName}>{profile?.full_name}</Text>
              <Text style={styles.profileEmail}>{profile?.email}</Text>
              <View style={styles.roleBadge}>
                <Ionicons name="shield-checkmark" size={12} color={theme.colors.primary} />
                <Text style={styles.roleText}>Admin</Text>
              </View>
            </View>
          </View>
        </View>

        {/* App info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alkalmazás</Text>

          <Card
            title="WorldSkills Mental Selection"
            subtitle="v1.0.0"
            icon="information-circle-outline"
            iconColor={theme.colors.info}
          />

          <Card
            title="Supabase Backend"
            subtitle="Adatbázis és autentikáció"
            icon="server-outline"
            iconColor={theme.colors.success}
          />
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Button
            title="Kijelentkezés"
            onPress={handleSignOut}
            variant="outline"
          />
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
  section: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.xs,
    fontWeight: '700',
    color: theme.colors.mediumGray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.xl,
    fontWeight: '700',
  },
  profileName: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '700',
    color: theme.colors.black,
  },
  profileEmail: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.gray,
    marginTop: 1,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: theme.spacing.xs,
  },
  roleText: {
    fontSize: theme.fontSizes.xs,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
