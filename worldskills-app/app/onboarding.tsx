import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WORLDSKILLS_SKILLS, WorldSkillsSkill } from '../lib/skills';
import { saveLocalProfile } from '../lib/storage';
import { Button } from '../components/Button';
import { theme } from '../lib/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<WorldSkillsSkill | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSkills = WORLDSKILLS_SKILLS.filter((s) =>
    s.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleStart() {
    if (!name.trim()) {
      Alert.alert('Hiba', 'Kérlek add meg a neved!');
      return;
    }
    if (!selectedSkill) {
      Alert.alert('Hiba', 'Válassz egy szakmát!');
      return;
    }

    await saveLocalProfile({
      name: name.trim(),
      skill: selectedSkill,
      setupComplete: true,
    });

    router.replace('/competitor');
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.logoRow}>
              <View style={styles.logoStar}>
                <Ionicons name="star" size={30} color={theme.colors.white} />
              </View>
            </View>
            <Text style={styles.title}>WorldSkills</Text>
            <Text style={styles.subtitle}>Mentális Kiválasztás</Text>
            <View style={styles.descriptionCard}>
              <Text style={styles.description}>
                Ez az alkalmazás a WorldSkills versenyekre való mentális felkészültségedet
                méri fel. Koncentráció, logikai gondolkodás, szemléletmód és célorientáció
                tesztek várnak rád.
              </Text>
              <View style={styles.modeRow}>
                <View style={styles.modeChip}>
                  <Ionicons name="school-outline" size={14} color={theme.colors.teal} />
                  <Text style={styles.modeChipText}>Gyakorló mód</Text>
                </View>
                <View style={styles.modeChip}>
                  <Ionicons name="timer-outline" size={14} color={theme.colors.magenta} />
                  <Text style={styles.modeChipText}>Kiválasztás mód</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Neved</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Vezetéknév Keresztnév"
              placeholderTextColor={theme.colors.mediumGray}
              autoCapitalize="words"
            />
          </View>

          {/* Skill selector */}
          <View style={styles.section}>
            <Text style={styles.label}>Szakma (WorldSkills Skill)</Text>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color={theme.colors.mediumGray} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Keresés..."
                placeholderTextColor={theme.colors.mediumGray}
              />
            </View>

            <View style={styles.skillGrid}>
              {filteredSkills.map((skill) => (
                <TouchableOpacity
                  key={skill}
                  style={[
                    styles.skillChip,
                    selectedSkill === skill && styles.skillChipActive,
                  ]}
                  onPress={() => setSelectedSkill(skill)}
                >
                  <Text style={[
                    styles.skillChipText,
                    selectedSkill === skill && styles.skillChipTextActive,
                  ]}>
                    {skill}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Indítás"
              onPress={handleStart}
              disabled={!name.trim() || !selectedSkill}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  scroll: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoRow: {
    marginBottom: theme.spacing.md,
  },
  logoStar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  title: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.gray,
    marginTop: 2,
  },
  descriptionCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
    width: '100%',
  },
  description: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.darkGray,
    lineHeight: 22,
    textAlign: 'center',
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  modeChipText: {
    fontSize: theme.fontSizes.xs,
    fontWeight: '600',
    color: theme.colors.darkGray,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '700',
    color: theme.colors.darkGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1.5,
    borderColor: theme.colors.lightGray,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    fontSize: theme.fontSizes.md,
    color: theme.colors.black,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1.5,
    borderColor: theme.colors.lightGray,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.sm,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.black,
  },
  skillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  skillChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.lightGray,
  },
  skillChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  skillChipText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.darkGray,
  },
  skillChipTextActive: {
    color: theme.colors.white,
    fontWeight: '700',
  },
  buttonContainer: {
    marginTop: theme.spacing.md,
  },
});
