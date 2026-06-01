import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orderAPI } from '../../api';

const STATUS_CFG = {
  pending:          { label: 'Pending',        color: '#F59E0B', bg: '#FFFBEB', icon: '⏳' },
  confirmed:        { label: 'Confirmed',       color: '#3B82F6', bg: '#EFF6FF', icon: '✅' },
  preparing:        { label: 'Preparing',       color: '#8B5CF6', bg: '#F5F3FF', icon: '👨‍🍳' },
  out_for_delivery: { label: 'On the Way',      color: '#F97316', bg: '#FFF7ED', icon: '🚴' },
  delivered:        { label: 'Delivered',       color: '#10B981', bg: '#ECFDF5', icon: '🎉' },
  cancelled:        { label: 'Cancelled',       color: '#EF4444', bg: '#FEF2F2', icon: '❌' },
};

const STEPS = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    try {
      const { data } = await orderAPI.getOrders();
      setOrders(data.results || data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#2D6A4F" /></View>;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>📦 My Orders</Text>
        <Text style={styles.count}>{orders.length} orders</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySub}>Your orders will appear here after you shop!</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#2D6A4F" />}>
          {orders.map(order => {
            const cfg = STATUS_CFG[order.status] || {};
            const stepIdx = STEPS.indexOf(order.status);
            const isExpanded = expanded === order.id;

            return (
              <TouchableOpacity
                key={order.id}
                style={styles.card}
                onPress={() => setExpanded(isExpanded ? null : order.id)}
                activeOpacity={0.85}>

                {/* Order Header */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderId}>Order #{order.id}</Text>
                    <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.icon} {cfg.label}</Text>
                  </View>
                </View>

                {/* Progress Bar */}
                {order.status !== 'cancelled' && (
                  <View style={styles.progressWrap}>
                    {STEPS.map((step, i) => (
                      <React.Fragment key={step}>
                        <View style={styles.stepWrap}>
                          <View style={[styles.stepDot, i <= stepIdx && styles.stepDotActive]}>
                            {i <= stepIdx && <Text style={styles.stepCheck}>✓</Text>}
                          </View>
                          <Text style={[styles.stepLabel, i <= stepIdx && styles.stepLabelActive]} numberOfLines={1}>
                            {STATUS_CFG[step]?.label}
                          </Text>
                        </View>
                        {i < STEPS.length - 1 && (
                          <View style={[styles.stepLine, i < stepIdx && styles.stepLineActive]} />
                        )}
                      </React.Fragment>
                    ))}
                  </View>
                )}

                {/* Summary Row */}
                <View style={styles.summaryRow}>
                  <Text style={styles.itemCount}>{order.items?.length} items</Text>
                  <Text style={styles.orderTotal}>₹{order.total}</Text>
                  <View style={styles.payBadge}>
                    <Text style={styles.payBadgeText}>{order.payment_method?.toUpperCase()}</Text>
                  </View>
                </View>

                {/* Expanded Details */}
                {isExpanded && (
                  <View style={styles.expanded}>
                    <View style={styles.divider} />

                    {/* Items */}
                    <Text style={styles.expandedTitle}>🛒 Items</Text>
                    {order.items?.map(item => (
                      <View key={item.id} style={styles.itemRow}>
                        <Text style={styles.itemName}>{item.product_name} × {item.quantity}</Text>
                        <Text style={styles.itemPrice}>₹{item.subtotal}</Text>
                      </View>
                    ))}

                    <View style={styles.divider} />

                    {/* Totals */}
                    <View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal</Text><Text style={styles.totalVal}>₹{order.subtotal}</Text></View>
                    <View style={styles.totalRow}><Text style={styles.totalLabel}>Delivery</Text><Text style={styles.totalVal}>₹{order.delivery_charge}</Text></View>
                    {order.discount_amount > 0 && <View style={styles.totalRow}><Text style={[styles.totalLabel, { color: '#EF4444' }]}>Discount</Text><Text style={[styles.totalVal, { color: '#EF4444' }]}>−₹{order.discount_amount}</Text></View>}
                    <View style={[styles.totalRow, { marginTop: 6 }]}><Text style={styles.grandLabel}>Total</Text><Text style={styles.grandVal}>₹{order.total}</Text></View>

                    {/* Address */}
                    <View style={styles.divider} />
                    <Text style={styles.expandedTitle}>📍 Delivery Address</Text>
                    <Text style={styles.addressText}>{order.delivery_address}</Text>
                    <Text style={styles.addressText}>{order.delivery_city} — {order.delivery_pincode}</Text>

                    {/* Delivery Boy */}
                    {order.delivery_boy_name && (
                      <View style={styles.deliveryBoyBox}>
                        <Text style={styles.deliveryBoyText}>🚴 Delivery by: {order.delivery_boy_name}</Text>
                      </View>
                    )}

                    {/* Status History */}
                    {order.status_history?.length > 0 && (
                      <>
                        <View style={styles.divider} />
                        <Text style={styles.expandedTitle}>📋 Status History</Text>
                        {order.status_history.map((h, i) => (
                          <View key={i} style={styles.historyRow}>
                            <View style={styles.historyDot} />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.historyStatus}>{h.status.replace('_', ' ')}</Text>
                              {h.note ? <Text style={styles.historyNote}>{h.note}</Text> : null}
                              <Text style={styles.historyTime}>{new Date(h.created_at).toLocaleString('en-IN')}</Text>
                            </View>
                          </View>
                        ))}
                      </>
                    )}
                  </View>
                )}

                <View style={styles.expandHint}>
                  <Text style={styles.expandHintText}>{isExpanded ? '▲ Less details' : '▼ More details'}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF8' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#1B4332' },
  count: { fontSize: 13, color: '#6B7F6B' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 72, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#1B4332', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7F6B', textAlign: 'center' },
  card: {
    backgroundColor: '#fff', margin: 12, marginBottom: 0,
    borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#F3F4F6',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  orderId: { fontSize: 17, fontWeight: '800', color: '#1B4332' },
  orderDate: { fontSize: 12, color: '#6B7F6B', marginTop: 2 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  statusText: { fontSize: 12, fontWeight: '700' },
  progressWrap: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  stepWrap: { alignItems: 'center', flex: 1 },
  stepDot: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  stepDotActive: { backgroundColor: '#2D6A4F' },
  stepCheck: { color: '#fff', fontSize: 10, fontWeight: '800' },
  stepLabel: { fontSize: 9, color: '#D1D5DB', textAlign: 'center', fontWeight: '600' },
  stepLabelActive: { color: '#2D6A4F' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#F3F4F6', marginTop: 10 },
  stepLineActive: { backgroundColor: '#2D6A4F' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemCount: { fontSize: 13, color: '#6B7F6B', flex: 1 },
  orderTotal: { fontSize: 18, fontWeight: '800', color: '#1B4332' },
  payBadge: { backgroundColor: '#F3F4F6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  payBadgeText: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  expanded: { marginTop: 12 },
  divider: { borderTopWidth: 1, borderTopColor: '#F3F4F6', marginVertical: 12 },
  expandedTitle: { fontSize: 13, fontWeight: '700', color: '#6B7F6B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  itemName: { fontSize: 14, color: '#374151' },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#1B4332' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalLabel: { fontSize: 13, color: '#6B7F6B' },
  totalVal: { fontSize: 13, fontWeight: '600', color: '#1B4332' },
  grandLabel: { fontSize: 16, fontWeight: '700', color: '#1B4332' },
  grandVal: { fontSize: 18, fontWeight: '900', color: '#2D6A4F' },
  addressText: { fontSize: 13, color: '#374151', marginBottom: 2 },
  deliveryBoyBox: { backgroundColor: '#D8F3DC', borderRadius: 8, padding: 10, marginTop: 8 },
  deliveryBoyText: { fontSize: 13, fontWeight: '600', color: '#1B4332' },
  historyRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  historyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2D6A4F', marginTop: 5 },
  historyStatus: { fontSize: 13, fontWeight: '700', color: '#1B4332', textTransform: 'capitalize' },
  historyNote: { fontSize: 12, color: '#6B7F6B' },
  historyTime: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  expandHint: { alignItems: 'center', marginTop: 10 },
  expandHintText: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
});
