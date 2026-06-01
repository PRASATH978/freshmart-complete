import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deliveryAPI } from '../../api';

export default function DeliveryHistoryScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    try {
      const { data } = await deliveryAPI.getMyDeliveries({ status: 'delivered' });
      setOrders(data.results || data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const totalEarnings = orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

  const renderOrder = ({ item }) => {
    const isExpanded = expanded === item.id;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setExpanded(isExpanded ? null : item.id)}
        activeOpacity={0.85}>

        <View style={styles.cardTop}>
          <View style={styles.deliveredIcon}>
            <Text style={{ fontSize: 20 }}>🎉</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderId}>Order #{item.id}</Text>
            <Text style={styles.customerName}>{item.customer_name}</Text>
            <Text style={styles.orderDate}>
              {new Date(item.created_at).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={styles.rightCol}>
            <Text style={styles.orderTotal}>₹{item.total}</Text>
            <View style={styles.deliveredBadge}>
              <Text style={styles.deliveredText}>✅ Delivered</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardMeta}>
          <Text style={styles.metaItem}>📦 {item.items?.length} items</Text>
          <Text style={styles.metaItem}>📍 {item.delivery_city}</Text>
          <Text style={styles.metaItem}>💳 {item.payment_method?.toUpperCase()}</Text>
        </View>

        {isExpanded && (
          <View style={styles.expanded}>
            <View style={styles.divider} />
            <Text style={styles.expandLabel}>📍 Delivery Address</Text>
            <Text style={styles.addressText}>{item.delivery_address}</Text>
            <Text style={styles.addressText}>{item.delivery_city} — {item.delivery_pincode}</Text>

            <View style={styles.divider} />
            <Text style={styles.expandLabel}>🛒 Items Delivered</Text>
            {item.items?.map(i => (
              <View key={i.id} style={styles.itemRow}>
                <Text style={styles.itemName}>{i.product_name} × {i.quantity}</Text>
                <Text style={styles.itemPrice}>₹{i.subtotal}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.expandHint}>
          <Text style={styles.expandHintText}>{isExpanded ? '▲ Less' : '▼ Details'}</Text>
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
        <Text style={styles.title}>📋 Delivery History</Text>
        <Text style={styles.count}>{orders.length} deliveries</Text>
      </View>

      {/* Summary Banner */}
      {orders.length > 0 && (
        <View style={styles.summaryBanner}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{orders.length}</Text>
            <Text style={styles.summaryLabel}>Total Deliveries</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              ₹{totalEarnings.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.summaryLabel}>Total Order Value</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              ₹{orders.length > 0 ? (totalEarnings / orders.length).toFixed(0) : 0}
            </Text>
            <Text style={styles.summaryLabel}>Avg Order</Text>
          </View>
        </View>
      )}

      {orders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No deliveries yet</Text>
          <Text style={styles.emptySub}>
            Your completed deliveries will appear here.
          </Text>
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#EA580C',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  count: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  summaryBanner: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6', padding: 14,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 18, fontWeight: '800', color: '#EA580C' },
  summaryLabel: { fontSize: 11, color: '#6B7F6B', marginTop: 2, fontWeight: '600' },
  summaryDivider: { width: 1, backgroundColor: '#F3F4F6' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 72, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#1B4332', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7F6B', textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 10,
    padding: 14, borderWidth: 1, borderColor: '#F3F4F6',
  },
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  deliveredIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center',
  },
  orderId: { fontSize: 15, fontWeight: '800', color: '#1B4332' },
  customerName: { fontSize: 13, color: '#374151', marginTop: 1 },
  orderDate: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  rightCol: { alignItems: 'flex-end' },
  orderTotal: { fontSize: 17, fontWeight: '800', color: '#1B4332', marginBottom: 4 },
  deliveredBadge: { backgroundColor: '#ECFDF5', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  deliveredText: { fontSize: 11, fontWeight: '700', color: '#10B981' },
  cardMeta: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  metaItem: { fontSize: 12, color: '#6B7F6B', fontWeight: '500' },
  expanded: { marginTop: 8 },
  divider: { borderTopWidth: 1, borderTopColor: '#F3F4F6', marginVertical: 10 },
  expandLabel: {
    fontSize: 12, fontWeight: '700', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
  },
  addressText: { fontSize: 13, color: '#374151', marginBottom: 2 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  itemName: { fontSize: 13, color: '#374151' },
  itemPrice: { fontSize: 13, fontWeight: '600', color: '#1B4332' },
  expandHint: { alignItems: 'center', marginTop: 8 },
  expandHintText: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
});
