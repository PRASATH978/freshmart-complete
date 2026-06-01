import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, ScrollView, TextInput,
  RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productAPI } from '../../api';
import Toast from 'react-native-toast-message';

const EMPTY = {
  title: '', description: '', offer_type: 'flat',
  discount_percent: '', min_order_amount: '0',
  coupon_code: '', is_active: true,
  start_date: '', end_date: '',
};

const OFFER_TYPES = ['product', 'category', 'flat', 'banner'];

export default function AdminOffersScreen() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data } = await productAPI.getOffers();
      setOffers(data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditItem(null); setForm(EMPTY); setModalVisible(true); };
  const openEdit = (o) => {
    setEditItem(o);
    setForm({
      ...o,
      discount_percent: String(o.discount_percent),
      min_order_amount: String(o.min_order_amount),
      start_date: o.start_date?.slice(0, 16) || '',
      end_date: o.end_date?.slice(0, 16) || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.discount_percent || !form.start_date || !form.end_date) {
      Toast.show({ type: 'error', text1: 'Please fill all required fields' });
      return;
    }
    setSaving(true);
    try {
      if (editItem) await productAPI.updateOffer(editItem.id, form);
      else await productAPI.createOffer(form);
      Toast.show({ type: 'success', text1: editItem ? 'Offer updated!' : 'Offer created!' });
      setModalVisible(false);
      load();
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to save offer' });
    }
    setSaving(false);
  };

  const handleDelete = (id, title) => {
    Alert.alert('Delete Offer', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await productAPI.deleteOffer(id);
            Toast.show({ type: 'success', text1: 'Offer deleted' });
            load();
          } catch { Toast.show({ type: 'error', text1: 'Delete failed' }); }
        },
      },
    ]);
  };

  const set = (k) => (v) => setForm({ ...form, [k]: v });
  const isExpired = (date) => new Date(date) < new Date();

  const renderOffer = ({ item }) => {
    const expired = isExpired(item.end_date);
    return (
      <View style={[styles.offerCard, expired && styles.offerCardExpired]}>
        <View style={styles.offerHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.offerType}>{item.offer_type.toUpperCase()}</Text>
            <Text style={[styles.offerTitle, expired && { color: '#374151' }]} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
          <View style={[styles.liveBadge, {
            backgroundColor: item.is_active && !expired ? '#D8F3DC' : '#FEE2E2'
          }]}>
            <Text style={[styles.liveText, {
              color: item.is_active && !expired ? '#1B4332' : '#DC2626'
            }]}>
              {item.is_active && !expired ? '🟢 LIVE' : expired ? 'EXPIRED' : 'OFF'}
            </Text>
          </View>
        </View>

        <Text style={[styles.offerDiscount, expired && { color: '#9CA3AF' }]}>
          {item.discount_percent}% OFF
        </Text>

        {item.coupon_code ? (
          <View style={styles.couponRow}>
            <Text style={styles.couponIcon}>🎟</Text>
            <Text style={[styles.couponCode, expired && { color: '#9CA3AF' }]}>
              {item.coupon_code}
            </Text>
          </View>
        ) : null}

        <Text style={styles.offerDates}>
          {new Date(item.start_date).toLocaleDateString('en-IN')} →{' '}
          {new Date(item.end_date).toLocaleDateString('en-IN')}
        </Text>

        <View style={styles.offerActions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
            <Text style={styles.editBtnText}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.title)}>
            <Text style={styles.deleteBtnText}>🗑 Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>🏷️ Offers</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Create</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color="#7C3AED" /></View>
      ) : (
        <FlatList
          data={offers}
          keyExtractor={i => String(i.id)}
          renderItem={renderOffer}
          contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor="#7C3AED"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏷️</Text>
              <Text style={styles.emptyTitle}>No offers yet</Text>
              <Text style={styles.emptyText}>Create your first offer to attract customers!</Text>
              <TouchableOpacity style={styles.createBtn} onPress={openAdd}>
                <Text style={styles.createBtnText}>+ Create Offer</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editItem ? '✏️ Edit Offer' : '🏷️ Create Offer'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <Text style={styles.mlabel}>Offer Title *</Text>
            <TextInput
              style={styles.minput} value={form.title} onChangeText={set('title')}
              placeholder="e.g. Weekend Mega Sale" placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.mlabel}>Description</Text>
            <TextInput
              style={[styles.minput, { minHeight: 60 }]} value={form.description}
              onChangeText={set('description')} placeholder="Describe the offer..."
              multiline placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.mlabel}>Offer Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {OFFER_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setForm({ ...form, offer_type: t })}
                  style={[styles.typeChip, form.offer_type === t && styles.typeChipActive]}>
                  <Text style={[styles.typeChipText, form.offer_type === t && styles.typeChipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.mrow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mlabel}>Discount % *</Text>
                <TextInput
                  style={styles.minput} value={form.discount_percent}
                  onChangeText={set('discount_percent')} keyboardType="decimal-pad"
                  placeholder="e.g. 20" placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mlabel}>Min Order (₹)</Text>
                <TextInput
                  style={styles.minput} value={form.min_order_amount}
                  onChangeText={set('min_order_amount')} keyboardType="decimal-pad"
                  placeholder="0" placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <Text style={styles.mlabel}>Coupon Code</Text>
            <TextInput
              style={styles.minput}
              value={form.coupon_code}
              onChangeText={v => setForm({ ...form, coupon_code: v.toUpperCase() })}
              placeholder="e.g. FRESH20"
              autoCapitalize="characters"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.mlabel}>Start Date & Time *</Text>
            <TextInput
              style={styles.minput} value={form.start_date} onChangeText={set('start_date')}
              placeholder="YYYY-MM-DDTHH:MM e.g. 2026-01-01T09:00" placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.mlabel}>End Date & Time *</Text>
            <TextInput
              style={styles.minput} value={form.end_date} onChangeText={set('end_date')}
              placeholder="YYYY-MM-DDTHH:MM e.g. 2026-01-31T23:59" placeholderTextColor="#9CA3AF"
            />

            <TouchableOpacity
              style={[styles.activeToggle, form.is_active && styles.activeToggleOn]}
              onPress={() => setForm({ ...form, is_active: !form.is_active })}>
              <Text style={[styles.activeToggleText, form.is_active && styles.activeToggleTextOn]}>
                {form.is_active ? '✅ Active — visible to customers' : '⚫ Inactive — hidden from customers'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}>
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>{editItem ? 'Update Offer' : 'Create Offer'}</Text>
              }
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
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#4C1D95',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  offerCard: {
    backgroundColor: '#1B4332', borderRadius: 18, marginBottom: 12, padding: 18,
  },
  offerCardExpired: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' },
  offerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  offerType: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: '700', letterSpacing: 0.8 },
  offerTitle: { fontSize: 17, fontWeight: '700', color: '#fff', marginTop: 2 },
  liveBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  liveText: { fontSize: 11, fontWeight: '700' },
  offerDiscount: { fontSize: 36, fontWeight: '900', color: '#fff', marginBottom: 6 },
  couponRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  couponIcon: { fontSize: 16 },
  couponCode: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 1.5 },
  offerDates: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 12 },
  offerActions: { flexDirection: 'row', gap: 10 },
  editBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 10, alignItems: 'center' },
  editBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  deleteBtn: { backgroundColor: '#FEE2E2', borderRadius: 10, paddingHorizontal: 16, padding: 10, alignItems: 'center' },
  deleteBtnText: { color: '#DC2626', fontWeight: '600', fontSize: 13 },
  empty: { padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1B4332', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#6B7F6B', textAlign: 'center', marginBottom: 20 },
  createBtn: { backgroundColor: '#7C3AED', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalSafe: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1B4332' },
  closeBtn: { fontSize: 20, color: '#6B7F6B', padding: 4 },
  modalScroll: { flex: 1, padding: 16 },
  mlabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 4 },
  minput: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14,
    color: '#111827', marginBottom: 12, backgroundColor: '#FAFAFA',
  },
  mrow: { flexDirection: 'row', gap: 12 },
  typeChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F3F4F6', marginRight: 8, borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  typeChipActive: { backgroundColor: '#EDE9FE', borderColor: '#7C3AED' },
  typeChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'capitalize' },
  typeChipTextActive: { color: '#7C3AED' },
  activeToggle: {
    padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB', alignItems: 'center', marginBottom: 16,
  },
  activeToggleOn: { backgroundColor: '#D8F3DC', borderColor: '#2D6A4F' },
  activeToggleText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  activeToggleTextOn: { color: '#1B4332' },
  saveBtn: {
    backgroundColor: '#7C3AED', borderRadius: 14,
    padding: 16, alignItems: 'center', marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
