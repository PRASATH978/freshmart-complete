import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, RefreshControl, Animated, Easing,
  Image, Dimensions, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { productAPI } from '../../api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext'; // ← ADD THIS
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const CAT_EMOJIS = {
  'Leafy Greens': '🥬',
  'Root Vegetables': '🥕',
  'Fruits & Tomatoes': '🍅',
  'Herbs & Spices': '🌿',
  'Exotic Vegetables': '🫑',
};

const CAT_COLORS = {
  'Leafy Greens': { bg: '#D1FAE5', text: '#065F46' },
  'Root Vegetables': { bg: '#FEF3C7', text: '#92400E' },
  'Fruits & Tomatoes': { bg: '#FEE2E2', text: '#991B1B' },
  'Herbs & Spices': { bg: '#DCFCE7', text: '#166534' },
  'Exotic Vegetables': { bg: '#EDE9FE', text: '#5B21B6' },
};

/* ── Product Card ── */
const ProductCard = ({ item, navigation, handleAdd }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const { wishlist, toggleWishlist } = useWishlist(); // ← NOW WORKS
  const isWishlisted = wishlist.includes(item.id);

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  const cardWidth = (width - 48) / 2;

  return (
    <Animated.View style={{ transform: [{ scale }], width: cardWidth, marginBottom: 14 }}>
      <TouchableOpacity
        style={styles.productCard}
        activeOpacity={0.95}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        {/* Image */}
        <View style={styles.productImgWrap}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.productImg}
              resizeMode="cover"
            />
          ) : (
            <Text style={{ fontSize: 40 }}>🥦</Text>
          )}

          {/* HEART BUTTON */}
          <TouchableOpacity
            style={styles.heartBtn}
            onPress={() => toggleWishlist(item.id)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isWishlisted ? 'heart' : 'heart-outline'}
              size={16}
              color={isWishlisted ? '#EF4444' : '#9CA3AF'}
            />
          </TouchableOpacity>

          {item.active_offer && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {item.active_offer.discount_percent}% OFF
              </Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.catLabel}>{item.category_name}</Text>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={11} color="#F59E0B" />
            <Text style={styles.ratingText}> {item.avg_rating}</Text>
            <Text style={styles.reviewCount}> ({item.review_count})</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{item.discounted_price}</Text>
            <Text style={styles.unit}>/{item.unit}</Text>
            {item.active_offer && (
              <Text style={styles.origPrice}> ₹{item.price}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.addBtn, item.stock === 0 && styles.addBtnDisabled]}
            onPress={() => handleAdd(item.id, item.name)}
            disabled={item.stock === 0}
            activeOpacity={0.8}
          >
            {item.stock > 0 && (
              <Ionicons name="add" size={14} color="#fff" style={{ marginRight: 3 }} />
            )}
            <Text style={styles.addBtnText}>
              {item.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ── Main Screen ── */
export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { addToCart, cart } = useCart();

  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const load = async () => {
    try {
      const [cats, prods, offs] = await Promise.all([
        productAPI.getCategories(),
        productAPI.getProducts({ featured: true }),
        productAPI.getOffers(),
      ]);
      setCategories(cats.data);
      setFeatured(prods.data.results || prods.data);
      setOffers(offs.data);
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    load();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleAdd = async (productId, name) => {
    const ok = await addToCart(productId, 1);
    Toast.show({
      type: ok ? 'success' : 'error',
      text1: ok ? `${name} added! 🛒` : 'Failed to add',
    });
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1B4332" />
        <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 13 }}>
          Loading fresh picks...
        </Text>
      </View>
    );
  }

  const offerColors = [
    ['#1B4332', '#2D6A4F'],
    ['#7C3AED', '#5B21B6'],
    ['#EA580C', '#C2410C'],
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Hello, {user?.first_name || user?.username} 👋
            </Text>
            <Text style={styles.subtitle}>Fresh vegetables, delivered fast</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Cart')}
            style={styles.cartBtn}
          >
            <Ionicons name="bag-outline" size={24} color="#1B4332" />
            {cart?.item_count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cart.item_count}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor="#1B4332"
            />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* ── SEARCH ── */}
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => navigation.navigate('Shop')}
            activeOpacity={0.8}
          >
            <Ionicons name="search-outline" size={18} color="#9CA3AF" />
            <Text style={styles.searchPlaceholder}>Search vegetables, fruits...</Text>
            <View style={styles.searchFilter}>
              <Ionicons name="options-outline" size={16} color="#1B4332" />
            </View>
          </TouchableOpacity>

          {/* ── OFFER BANNERS ── */}
          {offers.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
              >
                {offers.map((offer, index) => (
                  <View
                    key={offer.id}
                    style={[
                      styles.offerBanner,
                      { backgroundColor: offerColors[index % offerColors.length][0] },
                    ]}
                  >
                    <View style={styles.offerLeft}>
                      <View style={styles.offerTagWrap}>
                        <Text style={styles.offerTagText}>
                          🔥 {offer.offer_type.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.offerTitle} numberOfLines={2}>
                        {offer.title}
                      </Text>
                      <Text style={styles.offerSub}>
                        {offer.description || 'Limited time deal'}
                      </Text>
                      {offer.coupon_code ? (
                        <View style={styles.couponWrap}>
                          <Text style={styles.couponText}>{offer.coupon_code}</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.offerRight}>
                      <Text style={styles.offerPercent}>
                        {offer.discount_percent}%
                      </Text>
                      <Text style={styles.offerOff}>OFF</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── CATEGORIES ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Shop')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((cat) => {
                const color = CAT_COLORS[cat.name] || { bg: '#F3F4F6', text: '#374151' };
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catCard, { backgroundColor: color.bg }]}
                    onPress={() =>
                      navigation.navigate('Shop', {
                        categoryId: cat.id,
                        categoryName: cat.name,
                      })
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={styles.catEmoji}>{CAT_EMOJIS[cat.name] || '🥦'}</Text>
                    <Text style={[styles.catName, { color: color.text }]}>{cat.name}</Text>
                    <Text style={[styles.catCount, { color: color.text + '99' }]}>
                      {cat.product_count} items
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── FEATURED PRODUCTS ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Products</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Shop')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.productsGrid}>
              {featured.slice(0, 6).map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  navigation={navigation}
                  handleAdd={handleAdd}
                />
              ))}
            </View>
          </View>

        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  loader: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB',
  },

  /* HEADER */
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  greeting: { fontSize: 18, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cartBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: '#EF4444', borderRadius: 10,
    minWidth: 18, height: 18,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4, borderWidth: 2, borderColor: '#fff',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  /* SEARCH */
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 14,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  searchPlaceholder: { fontSize: 13, color: '#9CA3AF', marginLeft: 8, flex: 1 },
  searchFilter: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center',
  },

  /* OFFER BANNER */
  offerBanner: {
    width: width - 48, borderRadius: 20, padding: 20, marginRight: 12,
    flexDirection: 'row', alignItems: 'center', minHeight: 120,
  },
  offerLeft: { flex: 1 },
  offerTagWrap: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
    alignSelf: 'flex-start', marginBottom: 8,
  },
  offerTagText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  offerTitle: { color: '#fff', fontSize: 16, fontWeight: '800', lineHeight: 22 },
  offerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 4 },
  couponWrap: {
    marginTop: 10, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)', borderStyle: 'dashed',
  },
  couponText: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  offerRight: { alignItems: 'center', marginLeft: 12 },
  offerPercent: { color: '#fff', fontSize: 42, fontWeight: '900', lineHeight: 46 },
  offerOff: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '700' },

  /* SECTION */
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  seeAll: { fontSize: 13, fontWeight: '600', color: '#2D6A4F' },

  /* CATEGORY */
  catCard: {
    borderRadius: 16, padding: 14, marginRight: 10,
    alignItems: 'center', width: 88,
  },
  catEmoji: { fontSize: 30, marginBottom: 6 },
  catName: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  catCount: { fontSize: 10, marginTop: 2 },

  /* PRODUCTS GRID */
  productsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
  },

  /* PRODUCT CARD */
  productCard: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  productImgWrap: {
    backgroundColor: '#F0FDF4', height: 120,
    justifyContent: 'center', alignItems: 'center',
  },
  productImg: { width: '100%', height: '100%' },

  /* HEART BUTTON */
  heartBtn: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: '#fff', borderRadius: 20, padding: 5,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },

  discountBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: '#EF4444', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  discountText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  productInfo: { padding: 10 },
  productName: { fontSize: 13, fontWeight: '700', color: '#111827' },
  catLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { fontSize: 10, color: '#F59E0B', fontWeight: '600' },
  reviewCount: { fontSize: 10, color: '#9CA3AF' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6 },
  price: { fontSize: 15, fontWeight: '800', color: '#1B4332' },
  unit: { fontSize: 10, color: '#9CA3AF', marginLeft: 1 },
  origPrice: {
    fontSize: 10, color: '#D1D5DB',
    textDecorationLine: 'line-through', marginLeft: 4,
  },
  addBtn: {
    backgroundColor: '#1B4332', borderRadius: 10, paddingVertical: 8,
    alignItems: 'center', marginTop: 8,
    flexDirection: 'row', justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: '#E5E7EB' },
  addBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});