import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WORLDSKILLS_SKILLS, WorldSkillsSkill } from '../lib/skills';
import { saveLocalProfile, getLocalProfile } from '../lib/storage';
import { Button } from '../components/Button';
import { theme } from '../lib/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<WorldSkillsSkill | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    getLocalProfile().then((profile) => {
      if (profile?.setupComplete) {
        setName(profile.name);
        setSelectedSkill(profile.skill);
        setIsEditing(true);
      }
    });
  }, []);

  const filteredSkills = WORLDSKILLS_SKILLS.filter((s) =>
    s.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleStart() {
    if (!selectedSkill) {
      Alert.alert('Hiba', 'Válassz egy szakmát!');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Hiba', 'Kérlek add meg a neved!');
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
            <View style={styles.logoStar}>
              <Ionicons name="star" size={30} color={theme.colors.white} />
            </View>
            <Text style={styles.title}>WorldSkills</Text>
            <Text style={styles.subtitle}>Mentális Kiválasztás</Text>
            <Text style={styles.description}>
              Ez az alkalmazás a WorldSkills versenyekre való mentális
              felkészültségedet méri fel és segít a gyakorlásban.
            </Text>
          </View>

          {/* Step 1: Skill */}
          <View style={styles.section}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <Text style={styles.label}>Melyik szakmában versenyzel?</Text>
            <Text style={styles.labelHint}>Válaszd ki a szakmádat a listából</Text>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color={theme.colors.mediumGray} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Keresés szakmára..."
                placeholderTextColor={theme.colors.mediumGray}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={theme.colors.mediumGray} />
                </TouchableOpacity>
              )}
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
              {filteredSkills.length === 0 && (
                <Text style={styles.noResults}>Nincs találat: „{searchQuery}"</Text>
              )}
            </View>

            {selectedSkill && (
              <View style={styles.selectedBadge}>
                <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
                <Text style={styles.selectedText}>{selectedSkill}</Text>
              </View>
            )}
          </View>

          {/* Step 2: Name */}
          <View style={styles.section}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <Text style={styles.label}>Neved</Text>
            <Text style={styles.labelHint}>Így fognak az eredmények megjelenni</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Vezetéknév Keresztnév"
              placeholderTextColor={theme.colors.mediumGray}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title={isEditing ? 'Mentés' : 'Tovább'}
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
  container: { flex: 1, backgroundColor: theme.colors.white },
  scroll: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  // Hero
  hero: { alignItems: 'center', marginBottom: theme.spacing.xl },
  logoStar: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: theme.colors.navy,
    alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md, ...theme.shadows.md,
  },
  title: { fontSize: theme.fontSizes.xxl, fontWeight: '800', color: theme.colors.navy, letterSpacing: -0.5 },
  subtitle: { fontSize: theme.fontSizes.md, color: theme.colors.gray, marginTop: 2 },
  description: {
    fontSize: theme.fontSizes.sm, color: theme.colors.gray, textAlign: 'center',
    lineHeight: 22, marginTop: theme.spacing.md, paddingHorizontal: theme.spacing.md,
  },
  // Sections
  section: { marginBottom: theme.spacing.lg },
  stepBadge: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.navy,
    alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.sm,
  },
  stepNumber: { color: theme.colors.white, fontSize: theme.fontSizes.sm, fontWeight: '800' },
  label: { fontSize: theme.fontSizes.lg, fontWeight: '700', color: theme.colors.black, marginBottom: 2 },
  labelHint: { fontSize: theme.fontSizes.sm, color: theme.colors.gray, marginBottom: theme.spacing.md },
  // Input
  input: {
    borderWidth: 1.5, borderColor: theme.colors.lightGray, borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md, paddingVertical: 14, fontSize: theme.fontSizes.md,
    color: theme.colors.black, backgroundColor: theme.colors.background,
  },
  // Search
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md, paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm, borderWidth: 1.5, borderColor: theme.colors.lightGray,
  },
  searchInput: {
    flex: 1, paddingVertical: 10, paddingHorizontal: theme.spacing.sm,
    fontSize: theme.fontSizes.sm, color: theme.colors.black,
  },
  // Skills
  skillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
  skillChip: {
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full, backgroundColor: theme.colors.background,
    borderWidth: 1.5, borderColor: theme.colors.lightGray,
  },
  skillChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  skillChipText: { fontSize: theme.fontSizes.sm, color: theme.colors.darkGray },
  skillChipTextActive: { color: theme.colors.white, fontWeight: '700' },
  noResults: { fontSize: theme.fontSizes.sm, color: theme.colors.mediumGray, fontStyle: 'italic', padding: theme.spacing.md },
  selectedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: theme.spacing.md,
    backgroundColor: theme.colors.success + '12', paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm, borderRadius: theme.borderRadius.md,
  },
  selectedText: { fontSize: theme.fontSizes.sm, fontWeight: '600', color: theme.colors.success },
  // Button
  buttonContainer: { marginTop: theme.spacing.md },
});
