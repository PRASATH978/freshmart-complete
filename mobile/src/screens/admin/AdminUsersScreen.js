import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, ScrollView, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authAPI } from '../../api';

const ROLE_CFG = {
  admin:    { color: '#7C3AED', bg: '#EDE9FE', icon: '👑' },
  customer: { color: '#2D6A4F', bg: '#D8F3DC', icon: '🛒' },
  delivery: { color: '#EA580C', bg: '#FEF0E7', icon: '🚴' },
};

export default function AdminUsersScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const { data } = await authAPI.getUsers(roleFilter);
      setUsers(data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { setLoading(true); load(); }, [roleFilter]);

  const filtered = users.filter(u =>
    !search ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  );

  const renderUser = ({ item }) => {
    const cfg = ROLE_CFG[item.role] || {};
    return (
      <View style={styles.userCard}>
        <View style={[styles.avatar, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.avatarText, { color: cfg.color }]}>
            {item.username[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <View style={styles.userTop}>
            <Text style={styles.userName}>
              {item.first_name && item.last_name
                ? `${item.first_name} ${item.last_name}`
                : item.username}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.roleText, { color: cfg.color }]}>
                {cfg.icon} {item.role}
              </Text>
            </View>
          </View>
          <Text style={styles.userEmail}>@{item.username} • {item.email}</Text>
          {item.phone ? <Text style={styles.userPhone}>📱 {item.phone}</Text> : null}
          <View style={styles.userBottom}>
            <View style={[styles.statusDot, { backgroundColor: item.is_active ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.statusText}>{item.is_active ? 'Active' : 'Inactive'}</Text>
            <Text style={styles.joinDate}>Joined {new Date(item.created_at).toLocaleDateString('en-IN')}</Text>
          </View>
        </View>
      </View>
    );
  };

  const counts = {
    customer: users.filter(u => u.role === 'customer').length,
    delivery: users.filter(u => u.role === 'delivery').length,
    admin: users.filter(u => u.role === 'admin').length,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>👥 Users</Text>
        <Text style={styles.totalCount}>{users.length} total</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {[
          { role: 'customer', label: 'Customers', count: counts.customer },
          { role: 'delivery', label: 'Delivery', count: counts.delivery },
          { role: 'admin', label: 'Admins', count: counts.admin },
        ].map(s => (
          <View key={s.role} style={[styles.statCard, { backgroundColor: ROLE_CFG[s.role].bg }]}>
            <Text style={styles.statIcon}>{ROLE_CFG[s.role].icon}</Text>
            <Text style={[styles.statValue, { color: ROLE_CFG[s.role].color }]}>{s.count}</Text>
            <Text style={[styles.statLabel, { color: ROLE_CFG[s.role].color }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Role Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {['', 'customer', 'delivery', 'admin'].map(r => (
          <TouchableOpacity
            key={r}
            style={[styles.filterChip, roleFilter === r && styles.filterChipActive]}
            onPress={() => setRoleFilter(r)}>
            <Text style={[styles.filterText, roleFilter === r && styles.filterTextActive]}>
              {r ? `${ROLE_CFG[r]?.icon} ${r.charAt(0).toUpperCase() + r.slice(1)}` : 'All Users'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search */}
      <View style={styles.searchBox}>
        <Text>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email or phone..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#9CA3AF"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: '#9CA3AF', fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color="#7C3AED" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => String(i.id)}
          renderItem={renderUser}
          contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor="#7C3AED"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF8' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#4C1D95',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  totalCount: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  statsRow: {
    flexDirection: 'row', gap: 10, padding: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  filterScroll: {
    backgroundColor: '#fff', borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6', maxHeight: 52,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, margin: 8, marginRight: 0,
    borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  filterChipActive: { backgroundColor: '#EDE9FE', borderColor: '#7C3AED' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterTextActive: { color: '#7C3AED' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F3F4F6', margin: 12, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  userCard: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14,
    marginBottom: 10, padding: 14, gap: 12,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  avatarText: { fontSize: 20, fontWeight: '800' },
  userInfo: { flex: 1 },
  userTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  userName: { fontSize: 15, fontWeight: '700', color: '#1B4332', flex: 1, marginRight: 8 },
  roleBadge: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  roleText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  userEmail: { fontSize: 12, color: '#6B7F6B', marginBottom: 2 },
  userPhone: { fontSize: 12, color: '#6B7F6B', marginBottom: 4 },
  userBottom: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, color: '#6B7F6B', fontWeight: '600' },
  joinDate: { fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' },
  empty: { padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyText: { color: '#9CA3AF', fontSize: 14 },
});
