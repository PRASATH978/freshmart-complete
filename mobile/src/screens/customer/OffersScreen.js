import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
  Clipboard, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productAPI } from '../../api';
import Toast from 'react-native-toast-message';

export default function OffersScreen() {
  const [offers, setOffers] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [offs, prods] = await Promise.all([
        productAPI.getOffers(),
        productAPI.getProducts({}),
      ]);
      setOffers(offs.data);
      setSaleProducts((prods.data.results || prods.data).filter(p => p.active_offer));
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const copyCode = (code) => {
    Clipboard.setString(code);
    Toast.show({ type: 'success', text1: `Coupon "${code}" copied!`, text2: 'Paste it at checkout' });
  };

  const isExpired = (date) => new Date(date) < new Date();

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#FF6B35" /></View>;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#FF6B35" />}>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🏷️</Text>
          <Text style={styles.heroTitle}>Exclusive Offers</Text>
          <Text style={styles.heroSub}>Fresh deals every day — save more!</Text>
        </View>

        {/* Active Offers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Active Deals</Text>
          {offers.length === 0 ? (
            <View style={styles.emptyOffers}>
              <Text style={styles.emptyText}>No active offers right now. Check back soon!</Text>
            </View>
          ) : (
            offers.map(offer => {
              const expired = isExpired(offer.end_date);
              return (
                <View key={offer.id} style={[styles.offerCard, expired && styles.offerCardExpired]}>
                  <View style={styles.offerTop}>
                    <View>
                      <Text style={[styles.offerType, expired && { color: '#6B7F6B' }]}>
                        {offer.offer_type.toUpperCase()} OFFER
                      </Text>
                      <Text style={[styles.offerTitle, expired && { color: '#374151' }]}>{offer.title}</Text>
                    </View>
                    <View style={[styles.liveBadge, { backgroundColor: offer.is_active && !expired ? '#D8F3DC' : '#FEE2E2' }]}>
                      <Text style={[styles.liveText, { color: offer.is_active && !expired ? '#1B4332' : '#DC2626' }]}>
                        {offer.is_active && !expired ? '🟢 LIVE' : expired ? '⛔ EXPIRED' : '⚫ OFF'}
                      </Text>
                    </View>
                  </View>

                  {offer.description ? <Text style={styles.offerDesc}>{offer.description}</Text> : null}

                  <Text style={[styles.offerDiscount, expired && { color: '#9CA3AF' }]}>
                    {offer.discount_percent}% OFF
                  </Text>

                  {offer.min_order_amount > 0 && (
                    <Text style={styles.minOrder}>Min order: ₹{offer.min_order_amount}</Text>
                  )}

                  {offer.coupon_code ? (
                    <TouchableOpacity
                      style={[styles.couponBox, expired && styles.couponBoxExpired]}
                      onPress={() => !expired && copyCode(offer.coupon_code)}
                      disabled={expired}>
                      <Text style={[styles.couponCode, expired && { color: '#9CA3AF' }]}>
                        🎟 {offer.coupon_code}
                      </Text>
                      <View style={styles.copyBtn}>
                        <Text style={styles.copyBtnText}>{expired ? 'Expired' : 'Copy'}</Text>
                      </View>
                    </TouchableOpacity>
                  ) : null}

                  <Text style={styles.validity}>
                    📅 Valid: {new Date(offer.start_date).toLocaleDateString('en-IN')} → {new Date(offer.end_date).toLocaleDateString('en-IN')}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* Products on Sale */}
        {saleProducts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛍 Products on Sale</Text>
            {saleProducts.map(product => (
              <View key={product.id} style={styles.saleCard}>
                <View style={styles.saleImg}>
                  <Text style={{ fontSize: 36 }}>🥦</Text>
                  <View style={styles.saleBadge}>
                    <Text style={styles.saleBadgeText}>−{product.active_offer.discount_percent}%</Text>
                  </View>
                </View>
                <View style={styles.saleInfo}>
                  <Text style={styles.saleName}>{product.name}</Text>
                  <Text style={styles.saleOfferTitle}>{product.active_offer.title}</Text>
                  <View style={styles.salePriceRow}>
                    <Text style={styles.salePrice}>₹{product.discounted_price}</Text>
                    <Text style={styles.saleOrigPrice}>₹{product.price}</Text>
                    <Text style={styles.saleUnit}>/{product.unit}</Text>
                  </View>
                  <Text style={styles.savingsText}>
                    You save ₹{(parseFloat(product.price) - parseFloat(product.discounted_price)).toFixed(2)}!
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF8' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: {
    backgroundColor: '#FF6B35', padding: 28, alignItems: 'center',
  },
  heroEmoji: { fontSize: 48, marginBottom: 8 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1B4332', marginBottom: 14 },
  emptyOffers: { backgroundColor: '#fff', borderRadius: 14, padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#6B7F6B', textAlign: 'center' },
  offerCard: {
    backgroundColor: '#1B4332', borderRadius: 18, padding: 20, marginBottom: 14,
  },
  offerCardExpired: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' },
  offerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  offerType: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 0.8 },
  offerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 2 },
  liveBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  liveText: { fontSize: 11, fontWeight: '700' },
  offerDesc: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 8 },
  offerDiscount: { fontSize: 40, fontWeight: '900', color: '#fff', marginBottom: 4 },
  minOrder: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 10 },
  couponBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10,
  },
  couponBoxExpired: { backgroundColor: '#F3F4F6' },
  couponCode: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 1.5 },
  copyBtn: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 5 },
  copyBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  validity: { fontSize: 11, color: 'rgba(255,255,255,0.55)' },
  saleCard: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#F3F4F6', overflow: 'hidden',
  },
  saleImg: {
    width: 90, backgroundColor: '#D8F3DC', justifyContent: 'center',
    alignItems: 'center', position: 'relative',
  },
  saleBadge: {
    position: 'absolute', top: 6, right: 6, backgroundColor: '#FF6B35',
    borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2,
  },
  saleBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  saleInfo: { flex: 1, padding: 14 },
  saleName: { fontSize: 15, fontWeight: '700', color: '#1B4332' },
  saleOfferTitle: { fontSize: 12, color: '#FF6B35', fontWeight: '600', marginTop: 2 },
  salePriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 8 },
  salePrice: { fontSize: 20, fontWeight: '800', color: '#2D6A4F' },
  saleOrigPrice: { fontSize: 13, color: '#9CA3AF', textDecorationLine: 'line-through' },
  saleUnit: { fontSize: 12, color: '#6B7F6B' },
  savingsText: { fontSize: 12, color: '#EF4444', fontWeight: '700', marginTop: 4 },
});
