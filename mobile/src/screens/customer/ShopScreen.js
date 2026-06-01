import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, ScrollView, RefreshControl, Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productAPI } from '../../api';
import { useCart } from '../../context/CartContext';
import Toast from 'react-native-toast-message';

const BASE_URL = 'http://10.160.12.223:8000';

function getImageUrl(image) {
  if (!image) return null;
  if (image.startsWith('http')) return image;
  return `${BASE_URL}${image}`;
}

export default function ShopScreen({ navigation, route }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState(route?.params?.categoryId || null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { addToCart, cartItems = [] } = useCart();

  // ── Animations ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  // cart floating animations
  const cartShake = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(1)).current;

  const loadCategories = async () => {
    const { data } = await productAPI.getCategories();
    setCategories(data);
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCat) params.category = selectedCat;
      if (search.trim()) params.search = search.trim();
      const { data } = await productAPI.getProducts(params);
      setProducts(data.results || data);
    } catch {}
    setLoading(false);
    setRefreshing(false);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { loadProducts(); }, [selectedCat, search]);

  const triggerCartAnim = () => {
    Animated.sequence([
      Animated.timing(cartShake, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(cartShake, { toValue: -1, duration: 80, useNativeDriver: true }),
      Animated.timing(cartShake, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(cartShake, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.timing(badgeScale, { toValue: 1.4, duration: 120, useNativeDriver: true }),
      Animated.spring(badgeScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  const handleAdd = async (item) => {
    const ok = await addToCart(item.id, 1);

    if (ok) {
      triggerCartAnim();
      Toast.show({ type: 'success', text1: `${item.name} added!` });
    } else {
      Toast.show({ type: 'error', text1: 'Failed to add' });
    }
  };

  const cartRotate = cartShake.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-10deg', '10deg'],
  });

  const renderProduct = ({ item }) => {
    const imageUri = getImageUrl(item.image);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      >
        <View style={styles.imgBox}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <Text style={styles.emojiPlaceholder}>🥦</Text>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.catTag}>{item.category_name}</Text>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.rating}>⭐ {item.avg_rating} ({item.review_count})</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{item.discounted_price}/{item.unit}</Text>
            {item.active_offer && <Text style={styles.origPrice}>₹{item.price}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.addBtn, item.stock === 0 && styles.addBtnDis]}
            onPress={() => handleAdd(item)}
            disabled={item.stock === 0}
          >
            <Text style={styles.addBtnText}>
              {item.stock === 0 ? 'Out of Stock' : '+ Add'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>

      {/* HEADER */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}> 
        <Text style={styles.title}>🛍 Shop</Text>
        <Text style={styles.count}>{products.length} products</Text>
      </Animated.View>

      {/* SEARCH + FILTER */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search vegetables..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          <TouchableOpacity
            style={[styles.catChip, !selectedCat && styles.catChipActive]}
            onPress={() => setSelectedCat(null)}
          >
            <Text style={styles.catChipText}>All</Text>
          </TouchableOpacity>

          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catChip, selectedCat === cat.id && styles.catChipActive]}
              onPress={() => setSelectedCat(cat.id)}
            >
              <Text style={styles.catChipText}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* PRODUCTS */}
      {loading ? (
        <ActivityIndicator size="large" color="#2D6A4F" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={i => String(i.id)}
          renderItem={renderProduct}
          numColumns={2}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadProducts(); }}
            />
          }
        />
      )}

      {/* FLOATING CART BUTTON */}
      <Animated.View style={[styles.fab, { transform: [{ rotate: cartRotate }] }]}> 
        <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.fabIcon}>🛒</Text>

          {cartItems.length > 0 && (
            <Animated.View style={[styles.badge, { transform: [{ scale: badgeScale }] }]}> 
              <Text style={styles.badgeText}>{cartItems.length}</Text>
            </Animated.View>
          )}
        </TouchableOpacity>
      </Animated.View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF8' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', padding: 16,
  },
  title: { fontSize: 22, fontWeight: '700' },
  count: { fontSize: 13 },
  searchBox: {
    margin: 12, padding: 10, backgroundColor: '#F3F4F6', borderRadius: 12,
  },
  searchInput: { fontSize: 14 },
  catScroll: { paddingHorizontal: 12 },
  catChip: {
    padding: 10, marginRight: 8, borderRadius: 20, backgroundColor: '#fff'
  },
  catChipActive: { backgroundColor: '#D8F3DC' },
  catChipText: { fontSize: 13 },
  list: { padding: 12 },
  card: {
    flex: 1, margin: 6, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden'
  },
  imgBox: { height: 120, backgroundColor: '#D8F3DC', justifyContent: 'center', alignItems: 'center' },
  productImage: { width: '100%', height: '100%' },
  emojiPlaceholder: { fontSize: 40 },
  info: { padding: 10 },
  catTag: { fontSize: 10, color: '#6B7F6B' },
  name: { fontSize: 14, fontWeight: '700' },
  rating: { fontSize: 11 },
  priceRow: { flexDirection: 'row', gap: 6 },
  price: { fontSize: 15, fontWeight: '800' },
  origPrice: { textDecorationLine: 'line-through', fontSize: 11 },
  addBtn: { marginTop: 8, backgroundColor: '#2D6A4F', padding: 8, borderRadius: 8, alignItems: 'center' },
  addBtnDis: { backgroundColor: '#D1D5DB' },
  addBtnText: { color: '#fff', fontWeight: '700' },

  fab: {
    position: 'absolute',
    bottom: 25,
    right: 20,
    backgroundColor: '#1B4332',
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  fabIcon: { fontSize: 26, color: '#fff' },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});