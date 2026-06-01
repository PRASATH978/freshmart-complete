import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orderAPI, productAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

const STATUS_CFG = {
  pending:          { color: '#F59E0B', icon: '⏳' },
  confirmed:        { color: '#3B82F6', icon: '✅' },
  preparing:        { color: '#8B5CF6', icon: '👨‍🍳' },
  out_for_delivery: { color: '#F97316', icon: '🚴' },
  delivered:        { color: '#10B981', icon: '🎉' },
  cancelled:        { color: '#EF4444', icon: '❌' },
};

export default function AdminDashboardScreen() {
  const { user, logout } = useAuth();
  const [orderStats, setOrderStats] = useState(null);
  const [productStats, setProductStats] = useState(null);
  const [paymentStats, setPaymentStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [os, ps, pays, orders] = await Promise.all([
        orderAPI.getAdminStats(),
        productAPI.getAdminStats(),
        orderAPI.getPaymentStats(),
        orderAPI.getOrders(),
      ]);
      setOrderStats(os.data);
      setProductStats(ps.data);
      setPaymentStats(pays.data);
      setRecentOrders((orders.data.results || orders.data).slice(0, 5));
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: logout, style: 'destructive' },
    ]);
  };

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#7C3AED" /></View>;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>📊 Dashboard</Text>
          <Text style={styles.headerSub}>Welcome, {user?.username}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#7C3AED" />}>

        <View style={styles.content}>
          {/* Stats Grid */}
          <View style={styles.grid}>
            {[
              { label: 'Total Orders', value: orderStats?.total_orders || 0, icon: '📦', color: '#3B82F6', bg: '#EFF6FF' },
              { label: "Today's Revenue", value: `₹${orderStats?.today_revenue || 0}`, icon: '💰', color: '#10B981', bg: '#ECFDF5' },
              { label: 'Total Revenue', value: `₹${orderStats?.total_revenue || 0}`, icon: '📈', color: '#2D6A4F', bg: '#D8F3DC' },
              { label: 'Active Products', value: productStats?.active_products || 0, icon: '🥦', color: '#F97316', bg: '#FFF7ED' },
            ].map(s => (
              <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg, borderLeftColor: s.color }]}>
                <Text style={styles.statIcon}>{s.icon}</Text>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Order Status Summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📋 Order Status</Text>
            <View style={styles.statusGrid}>
              {[
                { label: 'Pending', value: orderStats?.pending_orders || 0, color: '#F59E0B' },
                { label: 'Delivered', value: orderStats?.delivered_orders || 0, color: '#10B981' },
                { label: 'Cancelled', value: orderStats?.cancelled_orders || 0, color: '#EF4444' },
                { label: 'Today', value: orderStats?.today_orders || 0, color: '#3B82F6' },
              ].map(s => (
                <View key={s.label} style={styles.statusItem}>
                  <Text style={[styles.statusValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statusLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Payment Summary */}
          {paymentStats && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>💳 Payment Overview</Text>
              <View style={styles.payRow}>
                {[
                  { label: 'Collected', value: `₹${paymentStats.total_collected?.toLocaleString('en-IN')}`, color: '#10B981' },
                  { label: 'Today', value: `₹${paymentStats.today_collected?.toLocaleString('en-IN')}`, color: '#3B82F6' },
                  { label: 'Failed', value: paymentStats.total_failed, color: '#EF4444' },
                  { label: 'Online', value: paymentStats.total_online, color: '#8B5CF6' },
                ].map(p => (
                  <View key={p.label} style={styles.payItem}>
                    <Text style={[styles.payValue, { color: p.color }]}>{p.value}</Text>
                    <Text style={styles.payLabel}>{p.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Low Stock Alert */}
          {productStats?.low_stock?.length > 0 && (
            <View style={[styles.card, styles.alertCard]}>
              <Text style={styles.alertTitle}>⚠️ Low Stock Alert</Text>
              {productStats.low_stock.map(p => (
                <View key={p.id} style={styles.alertRow}>
                  <Text style={styles.alertProduct}>🥦 {p.name}</Text>
                  <Text style={styles.alertStock}>{p.stock} left</Text>
                </View>
              ))}
            </View>
          )}

          {/* Recent Orders */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🕐 Recent Orders</Text>
            {recentOrders.length === 0 ? (
              <Text style={styles.noData}>No orders yet</Text>
            ) : (
              recentOrders.map(order => {
                const cfg = STATUS_CFG[order.status] || {};
                return (
                  <View key={order.id} style={styles.orderRow}>
                    <View style={styles.orderLeft}>
                      <Text style={styles.orderId}>#{order.id}</Text>
                      <Text style={styles.orderCustomer}>{order.customer_name}</Text>
                      <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString('en-IN')}</Text>
                    </View>
                    <View style={styles.orderRight}>
                      <Text style={styles.orderTotal}>₹{order.total}</Text>
                      <View style={[styles.orderStatusBadge, { backgroundColor: cfg.color + '20' }]}>
                        <Text style={[styles.orderStatusText, { color: cfg.color }]}>
                          {cfg.icon} {order.status.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Active Offers */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏷️ Active Info</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoValue2}>{productStats?.active_offers || 0}</Text>
                <Text style={styles.infoLabel2}>Active Offers</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoValue2}>{productStats?.total_categories || 0}</Text>
                <Text style={styles.infoLabel2}>Categories</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[styles.infoValue2, { color: '#EF4444' }]}>{productStats?.low_stock?.length || 0}</Text>
                <Text style={styles.infoLabel2}>Low Stock</Text>
              </View>
            </View>
          </View>

        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
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
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  logoutText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  content: { padding: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  statCard: { width: '47.5%', borderRadius: 14, padding: 14, borderLeftWidth: 4 },
  statIcon: { fontSize: 24, marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#6B7F6B', marginTop: 3, fontWeight: '500' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1B4332', marginBottom: 14 },
  statusGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statusItem: { alignItems: 'center' },
  statusValue: { fontSize: 24, fontWeight: '800' },
  statusLabel: { fontSize: 12, color: '#6B7F6B', marginTop: 3, fontWeight: '600' },
  payRow: { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', gap: 10 },
  payItem: { alignItems: 'center', minWidth: '22%' },
  payValue: { fontSize: 17, fontWeight: '800' },
  payLabel: { fontSize: 11, color: '#6B7F6B', marginTop: 3, fontWeight: '600' },
  alertCard: { borderColor: '#FCD34D', backgroundColor: '#FFFBEB' },
  alertTitle: { fontSize: 15, fontWeight: '700', color: '#92400E', marginBottom: 10 },
  alertRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: '#FDE68A' },
  alertProduct: { fontSize: 14, color: '#78350F' },
  alertStock: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
  noData: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: 16 },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6' },
  orderLeft: {},
  orderId: { fontSize: 14, fontWeight: '800', color: '#1B4332' },
  orderCustomer: { fontSize: 12, color: '#6B7F6B', marginTop: 1 },
  orderDate: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  orderRight: { alignItems: 'flex-end' },
  orderTotal: { fontSize: 16, fontWeight: '800', color: '#1B4332', marginBottom: 4 },
  orderStatusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  orderStatusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  infoGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  infoItem: { alignItems: 'center' },
  infoValue2: { fontSize: 24, fontWeight: '800', color: '#2D6A4F' },
  infoLabel2: { fontSize: 12, color: '#6B7F6B', marginTop: 3, fontWeight: '600' },
});
