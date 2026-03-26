import React from 'react';
import { View, ScrollView, StyleSheet, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth-context';
import { Button } from '../../components/Button';
import { theme } from '../../lib/theme';

export default function ProfileScreen() {
  const { profile, session, signOut } = useAuth();

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
        {/* Profile header */}
        <View style={styles.header}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'V'}
            </Text>
          </View>
          <Text style={styles.name}>{profile?.full_name || 'Versenyző'}</Text>
          <Text style={styles.email}>{session?.user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Versenyző</Text>
          </View>
        </View>

        {/* Info cards */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="mail-outline" size={20} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{session?.user?.email}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Teljes név</Text>
              <Text style={styles.infoValue}>{profile?.full_name || '—'}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Regisztráció</Text>
              <Text style={styles.infoValue}>
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('hu-HU')
                  : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Sign out */}
        <View style={styles.actions}>
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
  header: {
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.hero,
    fontWeight: '700',
  },
  name: {
    fontSize: theme.fontSizes.xl,
    fontWeight: '800',
    color: theme.colors.black,
  },
  email: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.gray,
    marginTop: 2,
  },
  roleBadge: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  roleText: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: '700',
  },
  infoSection: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  infoContent: {
    marginLeft: theme.spacing.md,
  },
  infoLabel: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.mediumGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.black,
    fontWeight: '600',
    marginTop: 2,
  },
  actions: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
});
