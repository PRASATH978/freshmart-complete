import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, RefreshControl, Animated, Easing,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productAPI } from '../../api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Toast from 'react-native-toast-message';


const CAT_EMOJIS = {
  'Leafy Greens': '🥬',
  'Root Vegetables': '🥕',
  'Fruits & Tomatoes': '🍅',
  'Herbs & Spices': '🌿',
  'Exotic Vegetables': '🫑',
};


const comboPacks = [
  {
    id: 1,
    title: "Daily Veggie Pack",
    subtitle: "Best for 2–3 people",
    discount: 25,
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999",
  },
  {
    id: 2,
    title: "Healthy Fruit Box",
    subtitle: "Fresh seasonal fruits",
    discount: 20,
    image: "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a",
  },
  {
    id: 3,
    title: "Kitchen Essentials Pack",
    subtitle: "Onion, Tomato, Potato combo",
    discount: 30,
    image: "https://images.unsplash.com/photo-1607305387299-a3d9611cd469",
  },
];


/* -------------------- PRODUCT CARD (animated per item) -------------------- */
const ProductCard = ({ item, navigation, handleAdd }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={styles.productCard}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <View style={styles.productImg}>
          <Image
            source={{ uri: item.image }}
            style={{ width: 100, height: 100, borderRadius: 12 }}
            resizeMode="cover"
          />
        </View>

        {item.active_offer && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {item.active_offer.discount_percent}% OFF
            </Text>
          </View>
        )}

        <Text style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>

        <Text style={styles.catLabel}>{item.category_name}</Text>

        <View style={styles.ratingRow}>
          <Text style={styles.ratingText}>⭐ {item.avg_rating}</Text>
          <Text style={styles.reviewCount}>({item.review_count})</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{item.discounted_price}</Text>
          <Text style={styles.unit}>/{item.unit}</Text>
        </View>

        {item.active_offer && (
          <Text style={styles.origPrice}>₹{item.price}</Text>
        )}

        <TouchableOpacity
          style={[styles.addBtn, item.stock === 0 && styles.addBtnDisabled]}
          onPress={() => handleAdd(item.id, item.name)}
          disabled={item.stock === 0}
        >
          <Text style={styles.addBtnText}>
            {item.stock === 0 ? 'Out of Stock' : '+ Add to Cart'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

/* -------------------- MAIN SCREEN -------------------- */
export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { addToCart, cart } = useCart();

  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* animations */
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const offerAnim = useRef(new Animated.Value(0)).current;

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

    /* page entrance animation */
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    /* floating offer animation */
    Animated.loop(
      Animated.sequence([
        Animated.timing(offerAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(offerAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleAdd = async (productId, name) => {
    const ok = await addToCart(productId, 1);
    Toast.show({
      type: ok ? 'success' : 'error',
      text1: ok ? `${name} added to cart!` : 'Failed to add',
    });
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor="#2D6A4F"
            />
          }
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>
                Hello, {user?.first_name || user?.username} 👋
              </Text>
              <Text style={styles.subtitle}>What would you like today?</Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('Cart')}
              style={styles.cartBtn}
            >
              <Text style={styles.cartIcon}>🛒</Text>
              {cart.item_count > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cart.item_count}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* SEARCH */}
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => navigation.navigate('Shop')}
          >
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchPlaceholder}>Search vegetables...</Text>
          </TouchableOpacity>

          {/* OFFERS */}
          {offers.length > 0 && (
            <Animated.View
              style={{
                transform: [
                  {
                    translateY: offerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5],
                    }),
                  },
                ],
              }}
            >
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.offerScroll}
              >
                {offers.map((offer) => (
                  <View key={offer.id} style={styles.offerBanner}>
                    <Text style={styles.offerTag}>
                      🔥 {offer.offer_type.toUpperCase()} OFFER
                    </Text>
                    <Text style={styles.offerTitle}>{offer.title}</Text>
                    <Text style={styles.offerDiscount}>
                      {offer.discount_percent}% OFF
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* CATEGORIES */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shop by Category</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((cat) => (
                <View key={cat.id}>
                  <TouchableOpacity
                    style={styles.catCard}
                    onPress={() =>
                      navigation.navigate('Shop', {
                        categoryId: cat.id,
                        categoryName: cat.name,
                      })
                    }
                  >
                    <Text style={styles.catEmoji}>
                      {CAT_EMOJIS[cat.name] || '🥦'}
                    </Text>
                    <Text style={styles.catName}>{cat.name}</Text>
                    <Text style={styles.catCount}>
                      {cat.product_count} items
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* FEATURED */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⭐ Featured Products</Text>

            <FlatList
  data={featured.slice(0, 9)}
  numColumns={3}
  scrollEnabled={false}
  keyExtractor={(i) => String(i.id)}
  columnWrapperStyle={styles.row}
  renderItem={({ item }) => (
    <ProductCard
      item={item}
      navigation={navigation}
      handleAdd={handleAdd}
    />
  )}
/>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF8' },
  container: { flex: 1 },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAF8',
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  greeting: { fontSize: 18, fontWeight: '700', color: '#1B4332' },
  subtitle: { fontSize: 12, color: '#6B7F6B', marginTop: 2 },

  cartBtn: { padding: 6, position: 'relative' },
  cartIcon: { fontSize: 26 },

  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },

  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  /* SEARCH */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  searchIcon: { fontSize: 14 },
  searchPlaceholder: { fontSize: 13, color: '#9CA3AF', marginLeft: 6 },

  /* OFFERS */
  offerScroll: {
    marginHorizontal: 12,
    marginTop: 10,
  },

  offerBanner: {
    width: 280,
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    padding: 16,
    marginRight: 10,
  },

  offerTag: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '700',
  },

  offerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  offerDiscount: { color: '#fff', fontSize: 28, fontWeight: '900' },

  /* SECTIONS */
  section: { paddingHorizontal: 12, paddingTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1B4332' },

  /* CATEGORY */
  catCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginRight: 10,
    alignItems: 'center',
    width: 84,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },

  catEmoji: { fontSize: 28, marginBottom: 4 },
  catName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1B4332',
    textAlign: 'center',
  },
  catCount: { fontSize: 9, color: '#6B7F6B', marginTop: 2 },

  /* PRODUCT CARD (IMPORTANT MOBILE FIX) */
  productCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },

  productImg: {
    backgroundColor: '#D8F3DC',
    borderRadius: 12,
    height: 95,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },

  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B4332',
  },

  catLabel: { fontSize: 10, color: '#6B7F6B', marginTop: 2 },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },

  ratingText: { fontSize: 10, color: '#F59E0B', fontWeight: '600' },
  reviewCount: { fontSize: 10, color: '#9CA3AF', marginLeft: 4 },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },

  row: { gap: 12 },

  price: { fontSize: 15, fontWeight: '800', color: '#2D6A4F' },
  unit: { fontSize: 10, color: '#6B7F6B' },

  origPrice: {
    fontSize: 10,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },

  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  discountText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  addBtn: {
    backgroundColor: '#2D6A4F',
    borderRadius: 10,
    paddingVertical: 7,
    alignItems: 'center',
    marginTop: 6,
  },

  row: {
  justifyContent: 'space-between',
},

  addBtnDisabled: { backgroundColor: '#D1D5DB' },

  addBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});