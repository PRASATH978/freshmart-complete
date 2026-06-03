import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Alert, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
import { orderAPI } from '../../api';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function CartScreen({ navigation }) {
  const { cart, updateItem, removeItem } = useCart();
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(null);
  const [applying, setApplying] = useState(false);

  const deliveryCharge = parseFloat(cart.total || 0) >= 500 ? 0 : 40;
  const discountAmt = discount?.discount || 0;
  const finalTotal = parseFloat(cart.total || 0) + deliveryCharge - discountAmt;

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setApplying(true);
    try {
      const { data } = await orderAPI.applyCoupon(coupon.toUpperCase());
      setDiscount(data);
      Toast.show({ type: 'success', text1: `✅ Save ₹${data.discount}!` });
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.error || 'Invalid coupon' });
    }
    setApplying(false);
  };

  const confirmRemove = (itemId, name) => {
    Alert.alert('Remove Item', `Remove ${name} from cart?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', onPress: () => removeItem(itemId), style: 'destructive' },
    ]);
  };

  /* ── Empty Cart ── */
  if (!cart.items || cart.items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Cart</Text>
        </View>
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="bag-outline" size={60} color="#D1FAE5" />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>
            Add fresh vegetables and fruits to get started!
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.navigate('Shop')}
            activeOpacity={0.8}
          >
            <Ionicons name="leaf-outline" size={18} color="#fff" />
            <Text style={styles.shopBtnText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{cart.item_count} items</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >

        {/* ── FREE DELIVERY PROGRESS ── */}
        {parseFloat(cart.total) < 500 && (
          <View style={styles.deliveryBar}>
            <View style={styles.deliveryBarTop}>
              <Ionicons name="bicycle-outline" size={16} color="#92400E" />
              <Text style={styles.deliveryBarText}>
                Add <Text style={{ fontWeight: '800' }}>
                  ₹{(500 - parseFloat(cart.total)).toFixed(0)}
                </Text> more for FREE delivery!
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min((parseFloat(cart.total) / 500) * 100, 100)}%` },
                ]}
              />
            </View>
          </View>
        )}

        {parseFloat(cart.total) >= 500 && (
          <View style={[styles.deliveryBar, { backgroundColor: '#D1FAE5', borderColor: '#6EE7B7' }]}>
            <View style={styles.deliveryBarTop}>
              <Ionicons name="checkmark-circle" size={16} color="#065F46" />
              <Text style={[styles.deliveryBarText, { color: '#065F46' }]}>
                🎉 You've unlocked FREE delivery!
              </Text>
            </View>
          </View>
        )}

        {/* ── CART ITEMS ── */}
        <View style={styles.section}>
          {cart.items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemImgWrap}>
                {item.product.image ? (
                  <Image
                    source={{ uri: item.product.image }}
                    style={styles.itemImg}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={{ fontSize: 28 }}>🥦</Text>
                )}
              </View>

              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.product.name}
                </Text>
                <Text style={styles.itemUnit}>
                  ₹{item.product.discounted_price}/{item.product.unit}
                </Text>

                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateItem(item.id, item.quantity - 1)}
                  >
                    <Ionicons name="remove" size={16} color="#1B4332" />
                  </TouchableOpacity>
                  <Text style={styles.qtyVal}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateItem(item.id, item.quantity + 1)}
                  >
                    <Ionicons name="add" size={16} color="#1B4332" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.itemRight}>
                <Text style={styles.itemTotal}>₹{item.subtotal}</Text>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => confirmRemove(item.id, item.product.name)}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* ── COUPON ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="pricetag-outline" size={18} color="#1B4332" />
            <Text style={styles.cardTitle}>Have a coupon?</Text>
          </View>
          <View style={styles.couponRow}>
            <TextInput
              style={styles.couponInput}
              placeholder="Enter coupon code"
              value={coupon}
              onChangeText={v => setCoupon(v.toUpperCase())}
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={applyCoupon}
              disabled={applying}
              activeOpacity={0.8}
            >
              <Text style={styles.applyBtnText}>{applying ? '...' : 'Apply'}</Text>
            </TouchableOpacity>
          </View>
          {discount && (
            <View style={styles.discountApplied}>
              <Ionicons name="checkmark-circle" size={16} color="#065F46" />
              <Text style={styles.discountAppliedText}>
                {discount.offer_title} — {discount.discount_percent}% off applied!
              </Text>
            </View>
          )}
        </View>

        {/* ── ORDER SUMMARY ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt-outline" size={18} color="#1B4332" />
            <Text style={styles.cardTitle}>Order Summary</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{parseFloat(cart.total).toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={[
              styles.summaryValue,
              deliveryCharge === 0 && { color: '#065F46', fontWeight: '700' }
            ]}>
              {deliveryCharge === 0 ? '🎉 FREE' : `₹${deliveryCharge}`}
            </Text>
          </View>

          {discountAmt > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#EF4444' }]}>Discount</Text>
              <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
                −₹{discountAmt.toFixed(2)}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{finalTotal.toFixed(2)}</Text>
          </View>
        </View>

      </ScrollView>

      {/* ── CHECKOUT BAR ── */}
      <View style={styles.checkoutBar}>
        <View>
          <Text style={styles.checkoutTotal}>₹{finalTotal.toFixed(2)}</Text>
          <Text style={styles.checkoutItems}>{cart.item_count} items · {deliveryCharge === 0 ? 'Free delivery' : `+₹${deliveryCharge} delivery`}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Checkout', {
            discount: discountAmt,
            coupon_applied: discount ? coupon : '',
          })}
        >
          <Text style={styles.checkoutBtnText}>Checkout</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },

  /* HEADER */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  headerBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  headerBadgeText: { fontSize: 12, fontWeight: '700', color: '#065F46' },

  /* EMPTY */
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIconWrap: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  shopBtn: {
    backgroundColor: '#1B4332',
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  /* DELIVERY BAR */
  deliveryBar: {
    backgroundColor: '#FFFBEB',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  deliveryBarTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  deliveryBarText: { fontSize: 13, color: '#92400E', fontWeight: '600', flex: 1 },
  progressBar: { height: 6, backgroundColor: '#FDE68A', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 3 },

  /* SECTION */
  section: { paddingHorizontal: 16, paddingTop: 16 },

  /* ITEM CARD */
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  itemImgWrap: {
    width: 64,
    height: 64,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  itemImg: { width: '100%', height: '100%' },
  itemInfo: { flex: 1, justifyContent: 'space-between' },
  itemName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  itemUnit: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  qtyBtn: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  qtyVal: { fontSize: 15, fontWeight: '800', color: '#111827', minWidth: 20, textAlign: 'center' },
  itemRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  itemTotal: { fontSize: 15, fontWeight: '800', color: '#1B4332' },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center', alignItems: 'center',
  },

  /* CARD */
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },

  /* COUPON */
  couponRow: { flexDirection: 'row', gap: 10 },
  couponInput: {
    flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: '#111827', letterSpacing: 1,
  },
  applyBtn: {
    backgroundColor: '#1B4332', borderRadius: 10,
    paddingHorizontal: 18, justifyContent: 'center',
  },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  discountApplied: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, backgroundColor: '#D1FAE5',
    borderRadius: 8, padding: 10,
  },
  discountAppliedText: { color: '#065F46', fontSize: 13, fontWeight: '600', flex: 1 },

  /* SUMMARY */
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  summaryLabel: { fontSize: 14, color: '#6B7280' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 },
  totalLabel: { fontSize: 17, fontWeight: '800', color: '#111827' },
  totalValue: { fontSize: 22, fontWeight: '900', color: '#1B4332' },

  /* CHECKOUT BAR */
  checkoutBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  checkoutTotal: { fontSize: 22, fontWeight: '900', color: '#1B4332' },
  checkoutItems: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  checkoutBtn: {
    backgroundColor: '#1B4332',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkoutBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});