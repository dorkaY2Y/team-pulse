import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { supabase } from '../../lib/supabase';
import { theme } from '../../lib/theme';
import { UserProfile } from '../../lib/supabase';

export default function UsersScreen() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  async function fetchUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'competitor')
      .order('full_name');

    setUsers((data as UserProfile[]) || []);
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  }

  const filteredUsers = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Versenyzők" subtitle={`${users.length} regisztrált versenyző`} />

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.mediumGray} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Keresés név vagy email alapján..."
          placeholderTextColor={theme.colors.mediumGray}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        <View style={styles.list}>
          {filteredUsers.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={theme.colors.lightGray} />
              <Text style={styles.emptyText}>
                {search ? 'Nincs találat' : 'Még nincs regisztrált versenyző'}
              </Text>
            </View>
          ) : (
            filteredUsers.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {user.full_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.full_name}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
                <Text style={styles.userDate}>
                  {new Date(user.created_at).toLocaleDateString('hu-HU')}
                </Text>
              </View>
            ))
          )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadows.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.sm,
    fontSize: theme.fontSizes.md,
    color: theme.colors.black,
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  userAvatarText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.lg,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.fontSizes.md,
    fontWeight: '700',
    color: theme.colors.black,
  },
  userEmail: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.gray,
    marginTop: 1,
  },
  userDate: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.mediumGray,
  },
});
