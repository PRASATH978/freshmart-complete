import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, ScrollView, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orderAPI, authAPI } from '../../api';
import Toast from 'react-native-toast-message';

const STATUS_LIST = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
const STATUS_CFG = {
  pending:          { color: '#F59E0B', bg: '#FFFBEB', icon: '⏳', label: 'Pending' },
  confirmed:        { color: '#3B82F6', bg: '#EFF6FF', icon: '✅', label: 'Confirmed' },
  preparing:        { color: '#8B5CF6', bg: '#F5F3FF', icon: '👨‍🍳', label: 'Preparing' },
  out_for_delivery: { color: '#F97316', bg: '#FFF7ED', icon: '🚴', label: 'On the Way' },
  delivered:        { color: '#10B981', bg: '#ECFDF5', icon: '🎉', label: 'Delivered' },
  cancelled:        { color: '#EF4444', bg: '#FEF2F2', icon: '❌', label: 'Cancelled' },
};

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const load = async () => {
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const [ords, dbs] = await Promise.all([
        orderAPI.getOrders(params),
        authAPI.getUsers('delivery'),
      ]);
      setOrders(ords.data.results || ords.data);
      setDeliveryBoys(dbs.data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { setLoading(true); load(); }, [filterStatus]);

  const openDetail = (order) => { setSelected(order); setDetailVisible(true); };

  const updateStatus = async (orderId, newStatus, deliveryBoy) => {
    try {
      const { data } = await orderAPI.updateOrder(orderId, { status: newStatus, delivery_boy: deliveryBoy });
      Toast.show({ type: 'success', text1: `Order #${orderId} → ${newStatus}` });
      setSelected(data);
      load();
    } catch { Toast.show({ type: 'error', text1: 'Update failed' }); }
  };

  const renderOrder = ({ item }) => {
    const cfg = STATUS_CFG[item.status] || {};
    return (
      <TouchableOpacity style={styles.orderCard} onPress={() => openDetail(item)}>
        <View style={styles.orderTop}>
          <View>
            <Text style={styles.orderId}>Order #{item.id}</Text>
            <Text style={styles.orderCustomer}>{item.customer_name}</Text>
            <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleDateString('en-IN')}</Text>
          </View>
          <View style={styles.orderRight}>
            <Text style={styles.orderTotal}>₹{item.total}</Text>
            <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.icon} {cfg.label}</Text>
            </View>
            <View style={styles.payBadge}>
              <Text style={styles.payBadgeText}>{item.payment_method?.toUpperCase()}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.orderItems}>{item.items?.length} items • Tap to manage</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>📦 Orders</Text>
        <Text style={styles.count}>{orders.length} orders</Text>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {['', ...STATUS_LIST].map(s => (
          <TouchableOpacity key={s} style={[styles.filterChip, filterStatus === s && styles.filterChipActive]} onPress={() => setFilter(s)}>
            <Text style={[styles.filterChipText, filterStatus === s && styles.filterChipTextActive]}>
              {s ? `${STATUS_CFG[s]?.icon} ${STATUS_CFG[s]?.label}` : 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color="#7C3AED" /></View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={i => String(i.id)}
          renderItem={renderOrder}
          contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No orders found</Text></View>}
        />
      )}

      {/* Order Detail Modal */}
      <Modal visible={detailVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          {selected && (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Order #{selected.id}</Text>
                <TouchableOpacity onPress={() => setDetailVisible(false)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll}>
                {/* Status Buttons */}
                <Text style={styles.sectionLabel}>Update Status</Text>
                <View style={styles.statusGrid}>
                  {STATUS_LIST.map(s => {
                    const cfg = STATUS_CFG[s];
                    const active = selected.status === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        style={[styles.statusBtn, { backgroundColor: active ? cfg.color : cfg.bg }]}
                        onPress={() => updateStatus(selected.id, s, selected.delivery_boy)}>
                        <Text style={{ fontSize: 16 }}>{cfg.icon}</Text>
                        <Text style={[styles.statusBtnText, { color: active ? '#fff' : cfg.color }]}>{cfg.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Assign Delivery Boy */}
                <Text style={styles.sectionLabel}>Assign Delivery Boy</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  <TouchableOpacity
                    style={[styles.dbChip, !selected.delivery_boy && styles.dbChipActive]}
                    onPress={() => updateStatus(selected.id, selected.status, null)}>
                    <Text style={styles.dbChipText}>Not Assigned</Text>
                  </TouchableOpacity>
                  {deliveryBoys.map(db => (
                    <TouchableOpacity
                      key={db.id}
                      style={[styles.dbChip, selected.delivery_boy === db.id && styles.dbChipActive]}
                      onPress={() => updateStatus(selected.id, selected.status, db.id)}>
                      <Text style={styles.dbChipText}>{db.first_name || db.username}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Customer Info */}
                <View style={styles.infoCard}>
                  <Text style={styles.sectionLabel}>👤 Customer</Text>
                  <Text style={styles.infoText}>{selected.customer_name}</Text>
                  <Text style={styles.infoSubText}>📱 {selected.customer_phone}</Text>
                  <Text style={styles.infoSubText}>📍 {selected.delivery_address}, {selected.delivery_city} — {selected.delivery_pincode}</Text>
                </View>

                {/* Items */}
                <View style={styles.infoCard}>
                  <Text style={styles.sectionLabel}>🛒 Items</Text>
                  {selected.items?.map(item => (
                    <View key={item.id} style={styles.itemRow}>
                      <Text style={styles.itemName}>{item.product_name} × {item.quantity}</Text>
                      <Text style={styles.itemPrice}>₹{item.subtotal}</Text>
                    </View>
                  ))}
                  <View style={styles.divider} />
                  <View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal</Text><Text>₹{selected.subtotal}</Text></View>
                  <View style={styles.totalRow}><Text style={styles.totalLabel}>Delivery</Text><Text>₹{selected.delivery_charge}</Text></View>
                  {selected.discount_amount > 0 && <View style={styles.totalRow}><Text style={[styles.totalLabel, { color: '#EF4444' }]}>Discount</Text><Text style={{ color: '#EF4444' }}>−₹{selected.discount_amount}</Text></View>}
                  <View style={[styles.totalRow, { marginTop: 6 }]}><Text style={{ fontSize: 16, fontWeight: '700' }}>Total</Text><Text style={{ fontSize: 18, fontWeight: '900', color: '#2D6A4F' }}>₹{selected.total}</Text></View>
                </View>

                {/* Status History */}
                {selected.status_history?.length > 0 && (
                  <View style={styles.infoCard}>
                    <Text style={styles.sectionLabel}>📋 Status History</Text>
                    {selected.status_history.map((h, i) => (
                      <View key={i} style={styles.historyRow}>
                        <View style={styles.historyDot} />
                        <View>
                          <Text style={styles.historyStatus}>{h.status.replace('_', ' ')}</Text>
                          {h.note ? <Text style={styles.historyNote}>{h.note}</Text> : null}
                          <Text style={styles.historyTime}>{new Date(h.created_at).toLocaleString('en-IN')}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
                <View style={{ height: 40 }} />
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF8' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#4C1D95' },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  count: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  filterScroll: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', maxHeight: 52 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, margin: 8, marginRight: 0, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: '#E5E7EB' },
  filterChipActive: { backgroundColor: '#EDE9FE', borderColor: '#7C3AED' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterChipTextActive: { color: '#7C3AED' },
  orderCard: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, padding: 14, borderWidth: 1, borderColor: '#F3F4F6' },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderId: { fontSize: 16, fontWeight: '800', color: '#1B4332' },
  orderCustomer: { fontSize: 13, color: '#374151', marginTop: 2 },
  orderDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  orderRight: { alignItems: 'flex-end', gap: 5 },
  orderTotal: { fontSize: 18, fontWeight: '800', color: '#1B4332' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  payBadge: { backgroundColor: '#F3F4F6', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  payBadgeText: { fontSize: 10, fontWeight: '700', color: '#6B7280' },
  orderItems: { fontSize: 12, color: '#9CA3AF' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#9CA3AF', fontSize: 14 },
  modalSafe: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1B4332' },
  closeBtn: { fontSize: 20, color: '#6B7F6B', padding: 4 },
  modalScroll: { flex: 1, padding: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 4 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statusBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  statusBtnText: { fontSize: 12, fontWeight: '700' },
  dbChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 8, borderWidth: 1.5, borderColor: '#E5E7EB' },
  dbChipActive: { backgroundColor: '#D8F3DC', borderColor: '#2D6A4F' },
  dbChipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  infoCard: { backgroundColor: '#F8FAF8', borderRadius: 12, padding: 14, marginBottom: 14 },
  infoText: { fontSize: 15, fontWeight: '600', color: '#1B4332', marginBottom: 4 },
  infoSubText: { fontSize: 13, color: '#6B7F6B', marginBottom: 3 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  itemName: { fontSize: 13, color: '#374151' },
  itemPrice: { fontSize: 13, fontWeight: '600', color: '#1B4332' },
  divider: { borderTopWidth: 1, borderTopColor: '#E5E7EB', marginVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalLabel: { fontSize: 13, color: '#6B7F6B' },
  historyRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  historyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2D6A4F', marginTop: 5 },
  historyStatus: { fontSize: 13, fontWeight: '700', color: '#1B4332', textTransform: 'capitalize' },
  historyNote: { fontSize: 12, color: '#6B7F6B' },
  historyTime: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
});
