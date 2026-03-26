import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../lib/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.redBar} />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
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
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.gray,
    marginTop: theme.spacing.xs,
  },
});
