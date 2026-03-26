import React, { useEffect, useState } from 'react';
import {
  View, ScrollView, StyleSheet, Text, RefreshControl,
  TouchableOpacity, TextInput, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { supabase } from '../../lib/supabase';
import { theme } from '../../lib/theme';

interface Test {
  id: string;
  title: string;
  description: string;
  is_active: boolean;
  time_limit_seconds: number | null;
  test_categories: { name: string; display_name: string };
  questions: { id: string }[];
}

export default function TestsManagement() {
  const [tests, setTests] = useState<Test[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTimeLimit, setNewTimeLimit] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  async function fetchTests() {
    const { data } = await supabase
      .from('tests')
      .select('*, test_categories(name, display_name), questions(id)')
      .order('created_at', { ascending: false });

    setTests((data as any) || []);
  }

  async function fetchCategories() {
    const { data } = await supabase.from('test_categories').select('*');
    setCategories(data || []);
    if (data && data.length > 0) setSelectedCategory(data[0].id);
  }

  useEffect(() => {
    fetchTests();
    fetchCategories();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await fetchTests();
    setRefreshing(false);
  }

  async function createTest() {
    if (!newTitle.trim()) {
      Alert.alert('Hiba', 'Add meg a teszt nevét!');
      return;
    }

    const { error } = await supabase.from('tests').insert({
      title: newTitle.trim(),
      description: newDescription.trim(),
      category_id: selectedCategory,
      time_limit_seconds: newTimeLimit ? parseInt(newTimeLimit) * 60 : null,
      is_active: true,
    });

    if (error) {
      Alert.alert('Hiba', 'Nem sikerült létrehozni a tesztet.');
    } else {
      setShowModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewTimeLimit('');
      fetchTests();
    }
  }

  async function toggleTestActive(testId: string, currentActive: boolean) {
    await supabase.from('tests').update({ is_active: !currentActive }).eq('id', testId);
    fetchTests();
  }

  async function deleteTest(testId: string) {
    Alert.alert(
      'Teszt törlése',
      'Biztosan törölni szeretnéd ezt a tesztet és az összes kérdését?',
      [
        { text: 'Mégsem', style: 'cancel' },
        {
          text: 'Törlés',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('tests').delete().eq('id', testId);
            fetchTests();
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Tesztek kezelése" subtitle={`${tests.length} teszt`} />

      <View style={styles.addButtonContainer}>
        <Button title="+ Új teszt" onPress={() => setShowModal(true)} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        <View style={styles.list}>
          {tests.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="clipboard-outline" size={48} color={theme.colors.lightGray} />
              <Text style={styles.emptyText}>Még nincs teszt létrehozva</Text>
            </View>
          ) : (
            tests.map((test) => (
              <View key={test.id} style={styles.testCard}>
                <View style={styles.testHeader}>
                  <View style={styles.testTitleRow}>
                    <Text style={styles.testTitle}>{test.title}</Text>
                    <View style={[styles.statusBadge, !test.is_active && styles.statusInactive]}>
                      <Text style={[styles.statusText, !test.is_active && styles.statusTextInactive]}>
                        {test.is_active ? 'Aktív' : 'Inaktív'}
                      </Text>
                    </View>
                  </View>
                  {test.description && (
                    <Text style={styles.testDescription}>{test.description}</Text>
                  )}
                </View>

                <View style={styles.testMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="folder-outline" size={14} color={theme.colors.gray} />
                    <Text style={styles.metaText}>
                      {test.test_categories?.display_name || '—'}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="help-circle-outline" size={14} color={theme.colors.gray} />
                    <Text style={styles.metaText}>
                      {test.questions?.length || 0} kérdés
                    </Text>
                  </View>
                  {test.time_limit_seconds && (
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={14} color={theme.colors.gray} />
                      <Text style={styles.metaText}>
                        {Math.round(test.time_limit_seconds / 60)} perc
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.testActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => toggleTestActive(test.id, test.is_active)}
                  >
                    <Ionicons
                      name={test.is_active ? 'pause-circle-outline' : 'play-circle-outline'}
                      size={20}
                      color={theme.colors.info}
                    />
                    <Text style={[styles.actionText, { color: theme.colors.info }]}>
                      {test.is_active ? 'Szüneteltetés' : 'Aktiválás'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => deleteTest(test.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                    <Text style={[styles.actionText, { color: theme.colors.error }]}>Törlés</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* New test modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Új teszt létrehozása</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.black} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teszt neve</Text>
              <TextInput
                style={styles.input}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="Pl. WorldSkills Általános Tudás"
                placeholderTextColor={theme.colors.mediumGray}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Leírás</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={newDescription}
                onChangeText={setNewDescription}
                placeholder="Rövid leírás..."
                placeholderTextColor={theme.colors.mediumGray}
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kategória</Text>
              <View style={styles.categoryRow}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      selectedCategory === cat.id && styles.categoryChipActive,
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      selectedCategory === cat.id && styles.categoryChipTextActive,
                    ]}>
                      {cat.display_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Időlimit (perc, opcionális)</Text>
              <TextInput
                style={styles.input}
                value={newTimeLimit}
                onChangeText={setNewTimeLimit}
                placeholder="Pl. 30"
                placeholderTextColor={theme.colors.mediumGray}
                keyboardType="number-pad"
              />
            </View>

            <Button title="Létrehozás" onPress={createTest} style={{ marginTop: theme.spacing.md }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  addButtonContainer: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  list: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    color: theme.colors.gray,
    fontSize: theme.fontSizes.md,
    marginTop: theme.spacing.md,
  },
  testCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  testHeader: {
    marginBottom: theme.spacing.sm,
  },
  testTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '700',
    color: theme.colors.black,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: theme.colors.success + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
  },
  statusInactive: {
    backgroundColor: theme.colors.mediumGray + '20',
  },
  statusText: {
    fontSize: theme.fontSizes.xs,
    fontWeight: '700',
    color: theme.colors.success,
  },
  statusTextInactive: {
    color: theme.colors.mediumGray,
  },
  testDescription: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.gray,
    marginTop: theme.spacing.xs,
  },
  testMeta: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.gray,
  },
  testActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
    paddingTop: theme.spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '600',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: '800',
    color: theme.colors.black,
  },
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
    paddingVertical: 12,
    fontSize: theme.fontSizes.md,
    color: theme.colors.black,
    backgroundColor: theme.colors.background,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  categoryChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.lightGray,
  },
  categoryChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryChipText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '600',
    color: theme.colors.gray,
  },
  categoryChipTextActive: {
    color: theme.colors.white,
  },
});
