import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getLocalProfile } from '../lib/storage';
import { theme } from '../lib/theme';

export default function IndexScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      const profile = await getLocalProfile();
      if (profile?.setupComplete) {
        router.replace('/competitor');
      } else {
        router.replace('/onboarding');
      }
      setChecking(false);
    }
    check();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoStar}>
          <Text style={styles.logoStarText}>★</Text>
        </View>
        <Text style={styles.title}>WorldSkills</Text>
        <Text style={styles.subtitle}>Mentális Kiválasztás</Text>
      </View>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  logoStar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  logoStarText: {
    fontSize: 36,
    color: theme.colors.white,
  },
  title: {
    fontSize: theme.fontSizes.hero,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.gray,
    marginTop: theme.spacing.xs,
  },
});
