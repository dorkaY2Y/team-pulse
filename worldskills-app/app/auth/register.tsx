import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { Button } from '../../components/Button';
import { theme } from '../../lib/theme';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  async function handleRegister() {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Hiba', 'Kérlek töltsd ki az összes mezőt!');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Hiba', 'A jelszavak nem egyeznek!');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Hiba', 'A jelszónak legalább 6 karakter hosszúnak kell lennie!');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email.trim(), password, fullName.trim());
    setLoading(false);

    if (error) {
      Alert.alert('Regisztrációs hiba', error.message);
    } else {
      Alert.alert(
        'Sikeres regisztráció!',
        'Kérlek erősítsd meg az email címedet a kiküldött levélben.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.redBar} />
          <Text style={styles.title}>Regisztráció</Text>
          <Text style={styles.subtitle}>Hozd létre a versenyző fiókodat</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Teljes név</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Vezetéknév Keresztnév"
              placeholderTextColor={theme.colors.mediumGray}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="nev@email.com"
              placeholderTextColor={theme.colors.mediumGray}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Jelszó</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 6 karakter"
              placeholderTextColor={theme.colors.mediumGray}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Jelszó megerősítése</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Jelszó újra"
              placeholderTextColor={theme.colors.mediumGray}
              secureTextEntry
            />
          </View>

          <Button
            title="Regisztráció"
            onPress={handleRegister}
            loading={loading}
            style={{ marginTop: theme.spacing.md }}
          />

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.back()}
          >
            <Text style={styles.backLinkText}>
              Már van fiókod? <Text style={styles.backLinkBold}>Bejelentkezés</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  redBar: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: '800',
    color: theme.colors.black,
  },
  subtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.gray,
    marginTop: theme.spacing.xs,
  },
  form: {},
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '600',
    color: theme.colors.darkGray,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  backLink: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  backLinkText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.gray,
  },
  backLinkBold: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
