import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RazorpayCheckout from 'react-native-razorpay';
import { orderAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import Toast from 'react-native-toast-message';

export default function CheckoutScreen({ navigation, route }) {
  const { user } = useAuth();
  const { cart, fetchCart } = useCart();
  const { discount = 0, coupon_applied = '' } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    delivery_address: user?.address || '',
    delivery_city: '',
    delivery_pincode: '',
    payment_method: 'cod',
    notes: '',
  });

  const deliveryCharge = parseFloat(cart.total) >= 500 ? 0 : 40;
  const finalTotal = parseFloat(cart.total) + deliveryCharge - discount;
  const set = (k) => (v) => setForm({ ...form, [k]: v });

  const handleOrder = async () => {
    if (!form.delivery_address.trim() || !form.delivery_city.trim() || !form.delivery_pincode.trim()) {
      Alert.alert('Missing Info', 'Please fill all delivery address fields');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create the order
      const { data: order } = await orderAPI.createOrder({
        ...form,
        discount_amount: discount,
        coupon_applied,
      });

      // Step 2: If online/upi payment, open Razorpay
      if (form.payment_method === 'online' || form.payment_method === 'upi') {
        const { data: paymentData } = await orderAPI.createRazorpayOrder({
          order_id: order.id,
        });

        const options = {
          description: 'FreshMart Order Payment',
          currency: 'INR',
          key: paymentData.razorpay_key_id,
          amount: paymentData.amount,
          order_id: paymentData.razorpay_order_id,
          name: 'FreshMart',
          prefill: {
            email: user?.email || '',
            contact: user?.phone || '',
            name: user?.username || '',
          },
          theme: { color: '#2D6A4F' },
        };

        RazorpayCheckout.open(options)
          .then(async (paymentResponse) => {
            // Payment successful - verify it
            await orderAPI.verifyPayment({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });

            await fetchCart();
            Toast.show({ type: 'success', text1: 'Payment successful! Order placed 🎉' });
            navigation.navigate('CustomerTabs');
          })
          .catch(async (error) => {
            // Payment failed or cancelled
            await orderAPI.paymentFailed({
              razorpay_order_id: paymentData.razorpay_order_id,
              error_description: error.description || 'Payment cancelled',
            });
            Alert.alert('Payment Failed', error.description || 'Payment was cancelled');
          });

      } else {
        // COD - just place order directly
        await fetchCart();
        Toast.show({ type: 'success', text1: 'Order placed successfully! 🎉' });
        navigation.navigate('CustomerTabs');
      }

    } catch (err) {
      Alert.alert('Order Failed', err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const PAYMENT_OPTIONS = [
    { value: 'cod', label: '💵 Cash on Delivery', desc: 'Pay when you receive your order' },
    { value: 'online', label: '💳 Online Payment', desc: 'UPI, Debit/Credit Card, Net Banking' },
    { value: 'upi', label: '📱 UPI Payment', desc: 'GPay, PhonePe, Paytm' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Delivery Address</Text>
          <Text style={styles.label}>Street Address *</Text>
          <TextInput style={styles.input} placeholder="House no, street, area..." value={form.delivery_address} onChangeText={set('delivery_address')} multiline placeholderTextColor="#9CA3AF" />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>City *</Text>
              <TextInput style={styles.input} placeholder="City" value={form.delivery_city} onChangeText={set('delivery_city')} placeholderTextColor="#9CA3AF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Pincode *</Text>
              <TextInput style={styles.input} placeholder="620001" value={form.delivery_pincode} onChangeText={set('delivery_pincode')} keyboardType="number-pad" placeholderTextColor="#9CA3AF" />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Payment Method</Text>
          {PAYMENT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.payOption, form.payment_method === opt.value && styles.payOptionActive]}
              onPress={() => setForm({ ...form, payment_method: opt.value })}>
              <View style={[styles.radio, form.payment_method === opt.value && styles.radioActive]}>
                {form.payment_method === opt.value && <View style={styles.radioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.payLabel, form.payment_method === opt.value && styles.payLabelActive]}>{opt.label}</Text>
                <Text style={styles.payDesc}>{opt.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Special Instructions</Text>
          <TextInput
            style={[styles.input, { minHeight: 60 }]}
            placeholder="Any special delivery instructions..."
            value={form.notes}
            onChangeText={set('notes')}
            multiline
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧾 Order Summary</Text>
          {cart.items?.map(item => (
            <View key={item.id} style={styles.summaryItem}>
              <Text style={styles.summaryItemName}>{item.product.name} × {item.quantity}</Text>
              <Text style={styles.summaryItemPrice}>₹{item.subtotal}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryVal}>₹{parseFloat(cart.total).toFixed(2)}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Delivery</Text><Text style={[styles.summaryVal, deliveryCharge === 0 && { color: '#2D6A4F' }]}>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</Text></View>
          {discount > 0 && <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: '#EF4444' }]}>Discount</Text><Text style={[styles.summaryVal, { color: '#EF4444' }]}>−₹{discount.toFixed(2)}</Text></View>}
          <View style={[styles.summaryRow, { marginTop: 8 }]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalVal}>₹{finalTotal.toFixed(2)}</Text>
          </View>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.orderBtn, loading && styles.orderBtnDis]}
          onPress={handleOrder}
          disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.orderBtnText}>✅ Place Order — ₹{finalTotal.toFixed(2)}</Text>}
        </TouchableOpacity>
        <Text style={styles.etaText}>⏰ Estimated delivery: within 2 hours</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF8' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backText: { fontSize: 24, color: '#2D6A4F', fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1B4332' },
  scroll: { flex: 1 },
  section: { backgroundColor: '#fff', margin: 12, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1B4332', marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14,
    color: '#111827', marginBottom: 12, backgroundColor: '#FAFAFA',
  },
  row: { flexDirection: 'row', gap: 12 },
  payOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, marginBottom: 10,
    backgroundColor: '#FAFAFA',
  },
  payOptionActive: { borderColor: '#2D6A4F', backgroundColor: '#D8F3DC' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: '#2D6A4F' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2D6A4F' },
  payLabel: { fontSize: 14, fontWeight: '700', color: '#374151' },
  payLabelActive: { color: '#1B4332' },
  payDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryItemName: { fontSize: 13, color: '#374151' },
  summaryItemPrice: { fontSize: 13, fontWeight: '600', color: '#1B4332' },
  divider: { borderTopWidth: 1, borderTopColor: '#F3F4F6', marginVertical: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: 14, color: '#6B7F6B' },
  summaryVal: { fontSize: 14, fontWeight: '600', color: '#1B4332' },
  totalLabel: { fontSize: 18, fontWeight: '700', color: '#1B4332' },
  totalVal: { fontSize: 22, fontWeight: '900', color: '#2D6A4F' },
  bottomBar: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  orderBtn: { backgroundColor: '#2D6A4F', borderRadius: 16, padding: 16, alignItems: 'center' },
  orderBtnDis: { opacity: 0.6 },
  orderBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  etaText: { textAlign: 'center', fontSize: 12, color: '#6B7F6B', marginTop: 8 },
});