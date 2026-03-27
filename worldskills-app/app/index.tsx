import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
        <View style={styles.logoBg}>
          <View style={styles.logoStar}>
            <Ionicons name="star" size={36} color={theme.colors.white} />
          </View>
        </View>
        <Text style={styles.title}>WorldSkills</Text>
        <Text style={styles.subtitle}>Mentális Kiválasztás</Text>
      </View>
      <ActivityIndicator size="large" color="rgba(255,255,255,0.6)" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.navy,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  logoBg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  logoStar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.fontSizes.hero,
    fontWeight: '800',
    color: theme.colors.white,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: theme.fontSizes.lg,
    color: 'rgba(255,255,255,0.6)',
    marginTop: theme.spacing.xs,
  },
});
