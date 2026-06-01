import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Linking, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deliveryAPI, orderAPI } from '../../api';
import Toast from 'react-native-toast-message';

const STATUS_CFG = {
  confirmed:        { color: '#3B82F6', bg: '#EFF6FF', icon: '✅', label: 'Confirmed' },
  preparing:        { color: '#8B5CF6', bg: '#F5F3FF', icon: '👨‍🍳', label: 'Preparing' },
  out_for_delivery: { color: '#F97316', bg: '#FFF7ED', icon: '🚴', label: 'On the Way' },
};

export default function ActiveDeliveriesScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    try {
      const { data } = await deliveryAPI.getMyDeliveries({});
      // Show all non-delivered, non-cancelled
      const active = (data.results || data).filter(o =>
        ['confirmed', 'preparing', 'out_for_delivery'].includes(o.status)
      );
      setOrders(active);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const startDelivery = async (orderId) => {
    setUpdating(true);
    try {
      await deliveryAPI.updateDeliveryStatus(orderId, { status: 'out_for_delivery' });
      Toast.show({ type: 'success', text1: '🚴 Delivery started!' });
      load();
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update status' });
    }
    setUpdating(false);
  };

  const markDelivered = (orderId, customerName) => {
    Alert.alert(
      '✅ Confirm Delivery',
      `Mark order for ${customerName} as delivered?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '✅ Yes, Delivered!',
          onPress: async () => {
            setUpdating(true);
            try {
              await deliveryAPI.updateDeliveryStatus(orderId, { status: 'delivered' });
              Toast.show({ type: 'success', text1: '🎉 Delivery completed!' });
              load();
              setExpanded(null);
            } catch {
              Toast.show({ type: 'error', text1: 'Update failed. Try again.' });
            }
            setUpdating(false);
          },
        },
      ]
    );
  };

  const callCustomer = (phone) => {
    if (!phone) { Toast.show({ type: 'error', text1: 'No phone number available' }); return; }
    Linking.openURL(`tel:${phone}`);
  };

  const renderOrder = ({ item }) => {
    const cfg = STATUS_CFG[item.status] || {};
    const isExpanded = expanded === item.id;

    return (
      <TouchableOpacity
        style={[styles.card, isExpanded && styles.cardExpanded]}
        onPress={() => setExpanded(isExpanded ? null : item.id)}
        activeOpacity={0.9}>

        {/* Order Header */}
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.orderId}>Order #{item.id}</Text>
            <Text style={styles.orderTime}>
              {new Date(item.created_at).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusText, { color: cfg.color }]}>
              {cfg.icon} {cfg.label}
            </Text>
          </View>
        </View>

        {/* Customer Box */}
        <View style={styles.customerBox}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.customer_name?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{item.customer_name}</Text>
            <Text style={styles.customerPhone}>📱 {item.customer_phone || 'No phone'}</Text>
            <Text style={styles.address} numberOfLines={2}>
              📍 {item.delivery_address}, {item.delivery_city}
            </Text>
            <Text style={styles.pincode}>📮 {item.delivery_pincode}</Text>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryItems}>{item.items?.length} items</Text>
          <Text style={styles.summaryTotal}>₹{item.total}</Text>
          <View style={styles.payBadge}>
            <Text style={styles.payText}>{item.payment_method?.toUpperCase()}</Text>
          </View>
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.expanded}>
            <View style={styles.divider} />

            {/* Items List */}
            <Text style={styles.expandLabel}>🛒 Items</Text>
            {item.items?.map(i => (
              <View key={i.id} style={styles.itemRow}>
                <Text style={styles.itemName}>{i.product_name} × {i.quantity}</Text>
                <Text style={styles.itemPrice}>₹{i.subtotal}</Text>
              </View>
            ))}

            {item.notes ? (
              <>
                <View style={styles.divider} />
                <Text style={styles.expandLabel}>📝 Customer Notes</Text>
                <Text style={styles.notesText}>{item.notes}</Text>
              </>
            ) : null}

            <View style={styles.divider} />

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => callCustomer(item.customer_phone)}>
                <Text style={styles.callBtnText}>📞 Call Customer</Text>
              </TouchableOpacity>

              {item.status === 'confirmed' || item.status === 'preparing' ? (
                <TouchableOpacity
                  style={[styles.startBtn, updating && { opacity: 0.6 }]}
                  onPress={() => startDelivery(item.id)}
                  disabled={updating}>
                  <Text style={styles.startBtnText}>
                    {updating ? '⏳ Updating...' : '🚴 Start Delivery'}
                  </Text>
                </TouchableOpacity>
              ) : item.status === 'out_for_delivery' ? (
                <TouchableOpacity
                  style={[styles.deliverBtn, updating && { opacity: 0.6 }]}
                  onPress={() => markDelivered(item.id, item.customer_name)}
                  disabled={updating}>
                  <Text style={styles.deliverBtnText}>
                    {updating ? '⏳ Updating...' : '✅ Mark Delivered'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}

        <View style={styles.expandHint}>
          <Text style={styles.expandHintText}>{isExpanded ? '▲ Less' : '▼ Details & Actions'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#EA580C" /></View>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>🚴 Active Deliveries</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{orders.length}</Text>
        </View>
      </View>

      {orders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🚴</Text>
          <Text style={styles.emptyTitle}>No active deliveries</Text>
          <Text style={styles.emptySub}>
            New orders will appear here once assigned by admin.
          </Text>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => { setLoading(true); load(); }}>
            <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={i => String(i.id)}
          renderItem={renderOrder}
          contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor="#EA580C"
            />
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
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#EA580C',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#fff', flex: 1 },
  countBadge: { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  countText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 72, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#1B4332', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7F6B', textAlign: 'center', marginBottom: 24 },
  refreshBtn: { backgroundColor: '#EA580C', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  refreshBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  card: {
    backgroundColor: '#fff', borderRadius: 18, marginBottom: 12,
    padding: 16, borderWidth: 1.5, borderColor: '#F3F4F6',
  },
  cardExpanded: { borderColor: '#EA580C' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderId: { fontSize: 18, fontWeight: '800', color: '#1B4332' },
  orderTime: { fontSize: 12, color: '#6B7F6B', marginTop: 2 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  statusText: { fontSize: 12, fontWeight: '700' },
  customerBox: {
    flexDirection: 'row', gap: 12, backgroundColor: '#F8FAF8',
    borderRadius: 12, padding: 12, marginBottom: 12,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FEF0E7', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#EA580C' },
  customerName: { fontSize: 15, fontWeight: '700', color: '#1B4332' },
  customerPhone: { fontSize: 13, color: '#6B7F6B', marginTop: 2 },
  address: { fontSize: 12, color: '#6B7F6B', marginTop: 3, lineHeight: 16 },
  pincode: { fontSize: 12, color: '#6B7F6B', marginTop: 1 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryItems: { fontSize: 13, color: '#6B7F6B', flex: 1 },
  summaryTotal: { fontSize: 18, fontWeight: '800', color: '#1B4332' },
  payBadge: { backgroundColor: '#F3F4F6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  payText: { fontSize: 10, fontWeight: '700', color: '#6B7280' },
  expanded: { marginTop: 10 },
  divider: { borderTopWidth: 1, borderTopColor: '#F3F4F6', marginVertical: 10 },
  expandLabel: {
    fontSize: 12, fontWeight: '700', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  itemName: { fontSize: 13, color: '#374151' },
  itemPrice: { fontSize: 13, fontWeight: '600', color: '#1B4332' },
  notesText: { fontSize: 13, color: '#374151', fontStyle: 'italic', lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 10 },
  callBtn: {
    flex: 1, backgroundColor: '#EFF6FF', borderRadius: 12,
    padding: 12, alignItems: 'center',
  },
  callBtnText: { color: '#1D4ED8', fontWeight: '700', fontSize: 13 },
  startBtn: {
    flex: 2, backgroundColor: '#EA580C', borderRadius: 12,
    padding: 12, alignItems: 'center',
  },
  startBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  deliverBtn: {
    flex: 2, backgroundColor: '#2D6A4F', borderRadius: 12,
    padding: 12, alignItems: 'center',
  },
  deliverBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  expandHint: { alignItems: 'center', marginTop: 10 },
  expandHintText: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
});
