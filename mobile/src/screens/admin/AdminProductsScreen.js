import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, Modal, ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productAPI } from '../../api';
import Toast from 'react-native-toast-message';

const EMPTY = { name: '', description: '', price: '', unit: 'kg', stock: '', category: '', is_active: true, is_featured: false };
const UNITS = ['kg', 'g', 'bunch', 'piece', 'dozen'];

export default function AdminProductsScreen() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('products');

  const load = async () => {
    try {
      const [prods, cats] = await Promise.all([
        productAPI.getProducts({}),
        productAPI.getCategories(),
      ]);
      setProducts(prods.data.results || prods.data);
      setCategories(cats.data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditItem(null); setForm(EMPTY); setModalVisible(true); };
  const openEdit = (p) => { setEditItem(p); setForm({ ...p, category: String(p.category) }); setModalVisible(true); };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.stock || !form.category) {
      Toast.show({ type: 'error', text1: 'Please fill all required fields' });
      return;
    }
    setSaving(true);
    try {
      if (editItem) await productAPI.updateProduct(editItem.id, form);
      else await productAPI.createProduct(form);
      Toast.show({ type: 'success', text1: editItem ? 'Product updated!' : 'Product added!' });
      setModalVisible(false);
      load();
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to save product' });
    }
    setSaving(false);
  };

  const handleDelete = (id, name) => {
    Alert.alert('Delete Product', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await productAPI.deleteProduct(id);
            Toast.show({ type: 'success', text1: 'Product deleted' });
            load();
          } catch { Toast.show({ type: 'error', text1: 'Delete failed' }); }
        },
      },
    ]);
  };

  const set = (k) => (v) => setForm({ ...form, [k]: v });
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      <View style={styles.productImg}><Text style={{ fontSize: 28 }}>🥦</Text></View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productCat}>{item.category_name}</Text>
        <View style={styles.productMeta}>
          <Text style={styles.productPrice}>₹{item.discounted_price}/{item.unit}</Text>
          <Text style={[styles.productStock, { color: item.stock < 10 ? '#EF4444' : '#10B981' }]}>
            Stock: {item.stock}
          </Text>
        </View>
        <View style={styles.productBadges}>
          <View style={[styles.badge, { backgroundColor: item.is_active ? '#D8F3DC' : '#FEE2E2' }]}>
            <Text style={[styles.badgeText, { color: item.is_active ? '#1B4332' : '#DC2626' }]}>
              {item.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
          {item.is_featured && (
            <View style={[styles.badge, { backgroundColor: '#FFFBEB' }]}>
              <Text style={[styles.badgeText, { color: '#92400E' }]}>⭐ Featured</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
          <Text style={styles.editBtnText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.name)}>
          <Text style={styles.deleteBtnText}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>🥦 Products</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {['products', 'categories'].map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'products' ? '🥦 Products' : '📂 Categories'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'products' && (
        <>
          <View style={styles.searchBox}>
            <Text>🔍</Text>
            <TextInput style={styles.searchInput} placeholder="Search products..." value={search} onChangeText={setSearch} placeholderTextColor="#9CA3AF" />
          </View>
          {loading ? (
            <View style={styles.loader}><ActivityIndicator size="large" color="#7C3AED" /></View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={i => String(i.id)}
              renderItem={renderProduct}
              contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
              ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No products found</Text></View>}
            />
          )}
        </>
      )}

      {tab === 'categories' && (
        <ScrollView contentContainerStyle={{ padding: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
          {categories.map(cat => (
            <View key={cat.id} style={styles.catCard}>
              <View>
                <Text style={styles.catName}>{cat.name}</Text>
                <Text style={styles.catDesc}>{cat.description || 'No description'}</Text>
              </View>
              <View style={styles.catBadge}>
                <Text style={styles.catBadgeText}>{cat.product_count} items</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editItem ? '✏️ Edit Product' : '➕ Add Product'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <Text style={styles.mlabel}>Product Name *</Text>
            <TextInput style={styles.minput} value={form.name} onChangeText={set('name')} placeholder="e.g. Fresh Spinach" placeholderTextColor="#9CA3AF" />

            <Text style={styles.mlabel}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {categories.map(cat => (
                <TouchableOpacity key={cat.id} onPress={() => setForm({ ...form, category: String(cat.id) })}
                  style={[styles.catChip, String(form.category) === String(cat.id) && styles.catChipActive]}>
                  <Text style={[styles.catChipText, String(form.category) === String(cat.id) && styles.catChipTextActive]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.mlabel}>Description</Text>
            <TextInput style={[styles.minput, { minHeight: 60 }]} value={form.description} onChangeText={set('description')} placeholder="Product description..." multiline placeholderTextColor="#9CA3AF" />

            <View style={styles.mrow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mlabel}>Price (₹) *</Text>
                <TextInput style={styles.minput} value={String(form.price)} onChangeText={set('price')} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#9CA3AF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mlabel}>Stock *</Text>
                <TextInput style={styles.minput} value={String(form.stock)} onChangeText={set('stock')} keyboardType="number-pad" placeholder="0" placeholderTextColor="#9CA3AF" />
              </View>
            </View>

            <Text style={styles.mlabel}>Unit *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {UNITS.map(u => (
                <TouchableOpacity key={u} onPress={() => setForm({ ...form, unit: u })}
                  style={[styles.catChip, form.unit === u && styles.catChipActive]}>
                  <Text style={[styles.catChipText, form.unit === u && styles.catChipTextActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.toggleRow}>
              <TouchableOpacity style={[styles.toggle, form.is_active && styles.toggleActive]} onPress={() => setForm({ ...form, is_active: !form.is_active })}>
                <Text style={[styles.toggleText, form.is_active && styles.toggleTextActive]}>
                  {form.is_active ? '✅ Active' : '⚫ Inactive'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggle, form.is_featured && styles.toggleActive]} onPress={() => setForm({ ...form, is_featured: !form.is_featured })}>
                <Text style={[styles.toggleText, form.is_featured && styles.toggleTextActive]}>
                  {form.is_featured ? '⭐ Featured' : '☆ Not Featured'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editItem ? 'Update Product' : 'Add Product'}</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
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
  addBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#7C3AED' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  tabTextActive: { color: '#7C3AED' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3F4F6', margin: 12, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  productCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, padding: 12, borderWidth: 1, borderColor: '#F3F4F6', gap: 10 },
  productImg: { width: 56, height: 56, backgroundColor: '#D8F3DC', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '700', color: '#1B4332' },
  productCat: { fontSize: 11, color: '#6B7F6B', marginTop: 1 },
  productMeta: { flexDirection: 'row', gap: 10, marginTop: 5 },
  productPrice: { fontSize: 13, fontWeight: '700', color: '#2D6A4F' },
  productStock: { fontSize: 12, fontWeight: '600' },
  productBadges: { flexDirection: 'row', gap: 6, marginTop: 6 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  productActions: { justifyContent: 'space-between' },
  editBtn: { backgroundColor: '#EDE9FE', borderRadius: 8, padding: 8, marginBottom: 6 },
  editBtnText: { fontSize: 16 },
  deleteBtn: { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 8 },
  deleteBtnText: { fontSize: 16 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#9CA3AF', fontSize: 14 },
  catCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  catName: { fontSize: 15, fontWeight: '700', color: '#1B4332' },
  catDesc: { fontSize: 12, color: '#6B7F6B', marginTop: 2 },
  catBadge: { backgroundColor: '#D8F3DC', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  catBadgeText: { fontSize: 12, fontWeight: '600', color: '#1B4332' },
  modalSafe: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1B4332' },
  closeBtn: { fontSize: 20, color: '#6B7F6B', padding: 4 },
  modalScroll: { flex: 1, padding: 16 },
  mlabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 4 },
  minput: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827', marginBottom: 12, backgroundColor: '#FAFAFA' },
  mrow: { flexDirection: 'row', gap: 12 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 8, borderWidth: 1.5, borderColor: '#E5E7EB' },
  catChipActive: { backgroundColor: '#D8F3DC', borderColor: '#2D6A4F' },
  catChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  catChipTextActive: { color: '#1B4332' },
  toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  toggle: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center', backgroundColor: '#F9FAFB' },
  toggleActive: { backgroundColor: '#D8F3DC', borderColor: '#2D6A4F' },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  toggleTextActive: { color: '#1B4332' },
  saveBtn: { backgroundColor: '#7C3AED', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
