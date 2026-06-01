import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, ScrollView, RefreshControl, Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orderAPI } from '../../api';
import Toast from 'react-native-toast-message';

const STATUS_CFG = {
  paid:     { color: '#10B981', bg: '#ECFDF5', icon: '✅', label: 'Paid' },
  created:  { color: '#F59E0B', bg: '#FFFBEB', icon: '⏳', label: 'Pending' },
  failed:   { color: '#EF4444', bg: '#FEF2F2', icon: '❌', label: 'Failed' },
  refunded: { color: '#8B5CF6', bg: '#F5F3FF', icon: '↩️', label: 'Refunded' },
};

export default function AdminPaymentsScreen() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilter] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const [pays, st] = await Promise.all([
        orderAPI.getAdminPayments(params),
        orderAPI.getPaymentStats(),
      ]);
      setPayments(pays.data.results || pays.data);
      setStats(st.data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { setLoading(true); load(); }, [filterStatus]);

  const copyId = (id) => {
    Clipboard.setString(id);
    Toast.show({ type: 'success', text1: 'Payment ID copied!' });
  };

  const filtered = payments.filter(p =>
    !search ||
    String(p.order_id).includes(search) ||
    p.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.razorpay_payment_id?.toLowerCase().includes(search.toLowerCase())
  );

  const renderPayment = ({ item }) => {
    const cfg = STATUS_CFG[item.status] || {};
    return (
      <View style={styles.payCard}>
        <View style={styles.payTop}>
          <View>
            <Text style={styles.payOrderId}>Order #{item.order_id}</Text>
            <Text style={styles.payCustomer}>{item.customer_name}</Text>
            <Text style={styles.payDate}>{new Date(item.created_at).toLocaleDateString('en-IN')}</Text>
          </View>
          <View style={styles.payRight}>
            <Text style={styles.payAmount}>₹{parseFloat(item.amount).toLocaleString('en-IN')}</Text>
            <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.icon} {cfg.label}</Text>
            </View>
          </View>
        </View>
        {item.razorpay_payment_id ? (
          <TouchableOpacity style={styles.payIdRow} onPress={() => copyId(item.razorpay_payment_id)}>
            <Text style={styles.payIdLabel}>Payment ID:</Text>
            <Text style={styles.payId} numberOfLines={1}>{item.razorpay_payment_id}</Text>
            <Text style={styles.copyIcon}>📋</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.noPay}>
            {item.payment_method === 'cod' ? '💵 Cash on Delivery' : '⏳ No payment recorded'}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>💳 Payments</Text>
      </View>

      {/* Stats */}
      {stats && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
          {[
            { label: 'Total Collected', value: `₹${stats.total_collected?.toLocaleString('en-IN')}`, color: '#10B981' },
            { label: "Today's", value: `₹${stats.today_collected?.toLocaleString('en-IN')}`, color: '#3B82F6' },
            { label: 'Online Paid', value: stats.total_online, color: '#8B5CF6' },
            { label: 'COD', value: stats.total_cod, color: '#F97316' },
            { label: 'Failed', value: stats.total_failed, color: '#EF4444' },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {['', 'paid', 'created', 'failed', 'refunded'].map(s => (
          <TouchableOpacity key={s} style={[styles.filterChip, filterStatus === s && styles.filterChipActive]} onPress={() => setFilter(s)}>
            <Text style={[styles.filterText, filterStatus === s && styles.filterTextActive]}>
              {s ? `${STATUS_CFG[s]?.icon} ${STATUS_CFG[s]?.label}` : 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search */}
      <View style={styles.searchBox}>
        <Text>🔍</Text>
        <TextInput style={styles.searchInput} placeholder="Search by order ID, customer, payment ID..." value={search} onChangeText={setSearch} placeholderTextColor="#9CA3AF" />
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color="#7C3AED" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => String(i.id)}
          renderItem={renderPayment}
          contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyIcon}>💳</Text><Text style={styles.emptyText}>No payments found</Text></View>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF8' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#4C1D95' },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  statsScroll: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', maxHeight: 80 },
  statCard: { padding: 14, paddingHorizontal: 18, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#F3F4F6' },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginTop: 2 },
  filterScroll: { backgroundColor: '#fff', maxHeight: 52 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, margin: 8, marginRight: 0, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: '#E5E7EB' },
  filterChipActive: { backgroundColor: '#EDE9FE', borderColor: '#7C3AED' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterTextActive: { color: '#7C3AED' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3F4F6', margin: 12, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  payCard: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, padding: 14, borderWidth: 1, borderColor: '#F3F4F6' },
  payTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  payOrderId: { fontSize: 15, fontWeight: '800', color: '#1B4332' },
  payCustomer: { fontSize: 13, color: '#374151', marginTop: 2 },
  payDate: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  payRight: { alignItems: 'flex-end', gap: 5 },
  payAmount: { fontSize: 18, fontWeight: '800', color: '#1B4332' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  payIdRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', borderRadius: 8, padding: 8 },
  payIdLabel: { fontSize: 11, color: '#6B7F6B', fontWeight: '600' },
  payId: { flex: 1, fontSize: 12, color: '#1B4332', fontWeight: '600' },
  copyIcon: { fontSize: 14 },
  noPay: { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' },
  empty: { padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyText: { color: '#9CA3AF', fontSize: 14 },
});
