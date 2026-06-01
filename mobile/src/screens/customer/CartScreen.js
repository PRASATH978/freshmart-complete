import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../../context/CartContext';
import { orderAPI } from '../../api';
import Toast from 'react-native-toast-message';

export default function CartScreen({ navigation }) {
  const { cart, updateItem, removeItem } = useCart();
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(null);
  const [applying, setApplying] = useState(false);

  const deliveryCharge = parseFloat(cart.total) >= 500 ? 0 : 40;
  const discountAmt = discount?.discount || 0;
  const finalTotal = parseFloat(cart.total) + deliveryCharge - discountAmt;

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setApplying(true);
    try {
      const { data } = await orderAPI.applyCoupon(coupon.toUpperCase());
      setDiscount(data);
      Toast.show({ type: 'success', text1: `Coupon applied! Save ₹${data.discount}` });
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

  if (!cart.items || cart.items.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Add fresh vegetables to get started!</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('CustomerTabs')}>
            <Text style={styles.shopBtnText}>🥦 Shop Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart ({cart.item_count} items)</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        {cart.items.map(item => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemImg}>
              <Text style={{ fontSize: 30 }}>🥦</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.product.name}</Text>
              <Text style={styles.itemUnit}>₹{item.product.discounted_price} per {item.product.unit}</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateItem(item.id, item.quantity - 1)}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyVal}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateItem(item.id, item.quantity + 1)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.itemTotal}>₹{item.subtotal}</Text>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => confirmRemove(item.id, item.product.name)}>
                <Text style={styles.deleteBtnText}>🗑</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Free Delivery Notice */}
        {parseFloat(cart.total) < 500 && (
          <View style={styles.freeDeliveryBar}>
            <Text style={styles.freeDeliveryText}>
              🚚 Add ₹{(500 - parseFloat(cart.total)).toFixed(2)} more for FREE delivery!
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min((parseFloat(cart.total) / 500) * 100, 100)}%` }]} />
            </View>
          </View>
        )}

        {/* Coupon */}
        <View style={styles.couponBox}>
          <Text style={styles.couponLabel}>🎟 Have a coupon?</Text>
          <View style={styles.couponRow}>
            <TextInput
              style={styles.couponInput}
              placeholder="Enter coupon code"
              value={coupon}
              onChangeText={v => setCoupon(v.toUpperCase())}
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.applyBtn} onPress={applyCoupon} disabled={applying}>
              <Text style={styles.applyBtnText}>{applying ? '...' : 'Apply'}</Text>
            </TouchableOpacity>
          </View>
          {discount && (
            <View style={styles.discountApplied}>
              <Text style={styles.discountAppliedText}>✅ {discount.offer_title} — {discount.discount_percent}% off applied!</Text>
            </View>
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{parseFloat(cart.total).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={[styles.summaryValue, deliveryCharge === 0 && { color: '#2D6A4F' }]}>
              {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
            </Text>
          </View>
          {discountAmt > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#EF4444' }]}>Discount</Text>
              <Text style={[styles.summaryValue, { color: '#EF4444' }]}>−₹{discountAmt.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{finalTotal.toFixed(2)}</Text>
          </View>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.checkoutBar}>
        <View>
          <Text style={styles.checkoutTotal}>₹{finalTotal.toFixed(2)}</Text>
          <Text style={styles.checkoutItems}>{cart.item_count} items</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Checkout', {
            discount: discountAmt,
            coupon_applied: discount ? coupon : '',
          })}>
          <Text style={styles.checkoutBtnText}>Proceed to Checkout →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF8' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backText: { fontSize: 24, color: '#2D6A4F', fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1B4332' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 72, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#1B4332', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7F6B', textAlign: 'center', marginBottom: 24 },
  shopBtn: { backgroundColor: '#2D6A4F', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  shopBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  scroll: { flex: 1 },
  itemCard: {
    flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16,
    marginTop: 12, borderRadius: 16, padding: 14, gap: 12,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  itemImg: { width: 60, height: 60, backgroundColor: '#D8F3DC', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '700', color: '#1B4332', marginBottom: 3 },
  itemUnit: { fontSize: 12, color: '#6B7F6B', marginBottom: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { backgroundColor: '#D8F3DC', borderRadius: 8, width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 18, fontWeight: '700', color: '#1B4332' },
  qtyVal: { fontSize: 16, fontWeight: '800', color: '#1B4332', minWidth: 24, textAlign: 'center' },
  itemRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  itemTotal: { fontSize: 16, fontWeight: '800', color: '#1B4332' },
  deleteBtn: { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 6 },
  deleteBtnText: { fontSize: 16 },
  freeDeliveryBar: { backgroundColor: '#FFFBEB', margin: 16, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#FDE68A' },
  freeDeliveryText: { fontSize: 13, color: '#92400E', fontWeight: '600', marginBottom: 8 },
  progressBar: { height: 6, backgroundColor: '#FDE68A', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 3 },
  couponBox: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  couponLabel: { fontSize: 14, fontWeight: '700', color: '#1B4332', marginBottom: 10 },
  couponRow: { flexDirection: 'row', gap: 10 },
  couponInput: {
    flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827',
  },
  applyBtn: { backgroundColor: '#2D6A4F', borderRadius: 10, paddingHorizontal: 18, justifyContent: 'center' },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  discountApplied: { marginTop: 10, backgroundColor: '#D8F3DC', borderRadius: 8, padding: 8 },
  discountAppliedText: { color: '#1B4332', fontSize: 13, fontWeight: '600' },
  summaryBox: { backgroundColor: '#fff', margin: 16, marginTop: 0, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#1B4332', marginBottom: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6' },
  summaryLabel: { fontSize: 14, color: '#6B7F6B' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#1B4332' },
  totalRow: { borderBottomWidth: 0, paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 18, fontWeight: '700', color: '#1B4332' },
  totalValue: { fontSize: 22, fontWeight: '900', color: '#2D6A4F' },
  checkoutBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  checkoutTotal: { fontSize: 22, fontWeight: '900', color: '#2D6A4F' },
  checkoutItems: { fontSize: 12, color: '#6B7F6B', marginTop: 1 },
  checkoutBtn: { backgroundColor: '#2D6A4F', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 14 },
  checkoutBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
