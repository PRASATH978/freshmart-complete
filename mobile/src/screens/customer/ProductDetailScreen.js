import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productAPI } from '../../api';
import { useCart } from '../../context/CartContext';
import Toast from 'react-native-toast-message';

const BASE_URL = 'http://10.160.12.223:8000';
function getImageUrl(image) {
  if (!image) return null;
  if (image.startsWith('http')) return image;
  return BASE_URL + image;
}

export default function ProductDetailScreen({ navigation, route }) {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [qty, setQty] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    Promise.all([
      productAPI.getProduct(productId),
      productAPI.getReviews(productId),
    ]).then(([p, r]) => {
      setProduct(p.data);
      setReviews(r.data);
    }).finally(() => setLoading(false));
  }, [productId]);

  const handleAdd = async () => {
    const ok = await addToCart(product.id, qty);
    if (ok) {
      Toast.show({ type: 'success', text1: `${qty} ${product.unit}(s) added to cart!` });
    } else {
      Toast.show({ type: 'error', text1: 'Failed to add to cart' });
    }
  };

  const handleReview = async () => {
    try {
      await productAPI.addReview(productId, reviewForm);
      Toast.show({ type: 'success', text1: 'Review submitted!' });
      const { data } = await productAPI.getReviews(productId);
      setReviews(data);
      setReviewForm({ rating: 5, comment: '' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to submit review' });
    }
  };

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#2D6A4F" /></View>;
  if (!product) return null;

  const savings = product.active_offer
    ? (parseFloat(product.price) - parseFloat(product.discounted_price)).toFixed(2)
    : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Product Image */}
        <View style={styles.imgBox}>
          {getImageUrl(product.image)
            ? <Image source={{ uri: getImageUrl(product.image) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            : <Text style={styles.productEmoji}>🥦</Text>}
          {product.active_offer && (
            <View style={styles.discBadge}>
              <Text style={styles.discText}>{product.active_offer.discount_percent}% OFF</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Category + Name */}
          <View style={styles.tags}>
            <View style={styles.catBadge}><Text style={styles.catBadgeText}>{product.category_name}</Text></View>
            {product.active_offer && (
              <View style={styles.offerBadge}><Text style={styles.offerBadgeText}>🔥 {product.active_offer.title}</Text></View>
            )}
          </View>
          <Text style={styles.name}>{product.name}</Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <Text style={styles.stars}>{'⭐'.repeat(Math.round(product.avg_rating))}</Text>
            <Text style={styles.ratingText}>{product.avg_rating} ({product.review_count} reviews)</Text>
          </View>

          {/* Description */}
          {product.description ? <Text style={styles.desc}>{product.description}</Text> : null}

          {/* Price */}
          <View style={styles.priceBox}>
            <View>
              <Text style={styles.price}>₹{product.discounted_price}</Text>
              <Text style={styles.perUnit}>per {product.unit}</Text>
            </View>
            {product.active_offer && (
              <View>
                <Text style={styles.origPrice}>₹{product.price}</Text>
                <Text style={styles.savings}>Save ₹{savings}!</Text>
              </View>
            )}
          </View>

          {/* Stock */}
          <View style={[styles.stockBadge, { backgroundColor: product.stock > 10 ? '#D8F3DC' : product.stock > 0 ? '#FFFBEB' : '#FEE2E2' }]}>
            <Text style={[styles.stockText, { color: product.stock > 10 ? '#1B4332' : product.stock > 0 ? '#92400E' : '#991B1B' }]}>
              {product.stock > 10 ? `✅ In Stock (${product.stock} available)` : product.stock > 0 ? `⚠️ Only ${product.stock} left!` : '❌ Out of Stock'}
            </Text>
          </View>

          {/* Qty Picker */}
          <View style={styles.qtyRow}>
            <Text style={styles.qtyLabel}>Quantity:</Text>
            <View style={styles.qtyControl}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(q => Math.max(1, q - 1))}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(q => q + 1)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Add to Cart */}
          <TouchableOpacity
            style={[styles.cartBtn, product.stock === 0 && styles.cartBtnDis]}
            onPress={handleAdd}
            disabled={product.stock === 0}>
            <Text style={styles.cartBtnText}>
              {product.stock === 0
                ? 'Out of Stock'
                : `🛒 Add ${qty} ${product.unit}(s) — ₹${(parseFloat(product.discounted_price) * qty).toFixed(2)}`}
            </Text>
          </TouchableOpacity>

          {/* Reviews */}
          <Text style={styles.reviewsTitle}>Customer Reviews ({reviews.length})</Text>

          {reviews.length === 0 ? (
            <Text style={styles.noReviews}>No reviews yet. Be the first!</Text>
          ) : (
            reviews.map(r => (
              <View key={r.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{r.username?.[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewer}>{r.username}</Text>
                    <Text style={styles.reviewStars}>{'⭐'.repeat(r.rating)}</Text>
                  </View>
                  <Text style={styles.reviewDate}>{new Date(r.created_at).toLocaleDateString('en-IN')}</Text>
                </View>
                {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
              </View>
            ))
          )}

          {/* Write Review */}
          <View style={styles.writeReview}>
            <Text style={styles.writeReviewTitle}>Write a Review</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n} onPress={() => setReviewForm({ ...reviewForm, rating: n })}>
                  <Text style={[styles.starBtn, { opacity: reviewForm.rating >= n ? 1 : 0.25 }]}>⭐</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience..."
              value={reviewForm.comment}
              onChangeText={v => setReviewForm({ ...reviewForm, comment: v })}
              multiline
              numberOfLines={3}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity style={styles.submitBtn} onPress={handleReview}>
              <Text style={styles.submitBtnText}>Submit Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF8' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { padding: 16, paddingBottom: 0 },
  backText: { color: '#2D6A4F', fontSize: 16, fontWeight: '600' },
  imgBox: {
    backgroundColor: '#D8F3DC', height: 220,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  productEmoji: { fontSize: 100 },
  discBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#FF6B35', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  discText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  content: { padding: 20 },
  tags: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  catBadge: { backgroundColor: '#D8F3DC', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  catBadgeText: { color: '#1B4332', fontSize: 12, fontWeight: '600' },
  offerBadge: { backgroundColor: '#FFF0EB', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  offerBadgeText: { color: '#FF6B35', fontSize: 12, fontWeight: '600' },
  name: { fontSize: 26, fontWeight: '800', color: '#1B4332', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  stars: { fontSize: 16 },
  ratingText: { fontSize: 13, color: '#6B7F6B' },
  desc: { fontSize: 14, color: '#6B7F6B', lineHeight: 20, marginBottom: 16 },
  priceBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    backgroundColor: '#F8FAF8', borderRadius: 14, padding: 16, marginBottom: 12,
  },
  price: { fontSize: 32, fontWeight: '900', color: '#2D6A4F' },
  perUnit: { fontSize: 13, color: '#6B7F6B', marginTop: 2 },
  origPrice: { fontSize: 16, color: '#9CA3AF', textDecorationLine: 'line-through', textAlign: 'right' },
  savings: { fontSize: 13, color: '#FF6B35', fontWeight: '700', marginTop: 2, textAlign: 'right' },
  stockBadge: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 16 },
  stockText: { fontSize: 13, fontWeight: '600' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  qtyLabel: { fontSize: 15, fontWeight: '600', color: '#1B4332' },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { backgroundColor: '#D8F3DC', borderRadius: 10, width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 22, fontWeight: '700', color: '#1B4332' },
  qtyValue: { fontSize: 20, fontWeight: '800', color: '#1B4332', width: 30, textAlign: 'center' },
  cartBtn: { backgroundColor: '#2D6A4F', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 24 },
  cartBtnDis: { backgroundColor: '#D1D5DB' },
  cartBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  reviewsTitle: { fontSize: 18, fontWeight: '700', color: '#1B4332', marginBottom: 14 },
  noReviews: { fontSize: 14, color: '#6B7F6B', marginBottom: 20 },
  reviewCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#D8F3DC', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: '800', fontSize: 16, color: '#1B4332' },
  reviewer: { fontSize: 14, fontWeight: '700', color: '#1B4332' },
  reviewStars: { fontSize: 12, marginTop: 1 },
  reviewDate: { fontSize: 11, color: '#9CA3AF' },
  reviewComment: { fontSize: 14, color: '#374151', lineHeight: 20 },
  writeReview: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', marginTop: 8 },
  writeReviewTitle: { fontSize: 16, fontWeight: '700', color: '#1B4332', marginBottom: 12 },
  starsRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  starBtn: { fontSize: 28 },
  reviewInput: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 12, fontSize: 14, color: '#111827', textAlignVertical: 'top', minHeight: 80,
  },
  submitBtn: { backgroundColor: '#2D6A4F', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
