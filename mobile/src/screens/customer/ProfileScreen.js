import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api';
import Toast from 'react-native-toast-message';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  const set = (k) => (v) => setForm({ ...form, [k]: v });

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await authAPI.updateProfile(form);
      updateUser(data);
      setEditing(false);
      Toast.show({ type: 'success', text1: 'Profile updated!' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update profile' });
    }
    setSaving(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: logout, style: 'destructive' },
    ]);
  };

  const ROLE_COLOR = { admin: '#7C3AED', customer: '#2D6A4F', delivery: '#EA580C' };
  const ROLE_BG = { admin: '#EDE9FE', customer: '#D8F3DC', delivery: '#FEF0E7' };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>
              {(user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.fullName}>
            {user?.first_name && user?.last_name
              ? `${user.first_name} ${user.last_name}`
              : user?.username}
          </Text>
          <Text style={styles.username}>@{user?.username}</Text>
          <View style={[styles.roleBadge, { backgroundColor: ROLE_BG[user?.role] }]}>
            <Text style={[styles.roleText, { color: ROLE_COLOR[user?.role] }]}>
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </Text>
          </View>
        </View>

        {/* Info / Edit Form */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Personal Information</Text>
            {!editing ? (
              <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
                <Text style={styles.editBtnText}>✏️ Edit</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>

          {editing ? (
            <>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>First Name</Text>
                  <TextInput style={styles.input} value={form.first_name} onChangeText={set('first_name')} placeholder="First name" placeholderTextColor="#9CA3AF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Last Name</Text>
                  <TextInput style={styles.input} value={form.last_name} onChangeText={set('last_name')} placeholder="Last name" placeholderTextColor="#9CA3AF" />
                </View>
              </View>
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#9CA3AF" />
              <Text style={styles.label}>Phone</Text>
              <TextInput style={styles.input} value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder="+91 9999999999" placeholderTextColor="#9CA3AF" />
              <Text style={styles.label}>Address</Text>
              <TextInput style={[styles.input, { minHeight: 60 }]} value={form.address} onChangeText={set('address')} multiline placeholder="Your address..." placeholderTextColor="#9CA3AF" />
              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {[
                { label: 'Email', value: user?.email, icon: '📧' },
                { label: 'Phone', value: user?.phone || 'Not set', icon: '📱' },
                { label: 'Address', value: user?.address || 'Not set', icon: '📍' },
                { label: 'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : '—', icon: '📅' },
              ].map(item => (
                <View key={item.label} style={styles.infoRow}>
                  <Text style={styles.infoIcon}>{item.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>{item.label}</Text>
                    <Text style={styles.infoValue}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Quick Links */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Links</Text>
          {[
            { icon: '📦', label: 'My Orders', desc: 'View all your orders' },
            { icon: '🏷️', label: 'Offers & Coupons', desc: 'Check available deals' },
            { icon: '🛒', label: 'Continue Shopping', desc: 'Browse fresh vegetables' },
          ].map(item => (
            <TouchableOpacity key={item.label} style={styles.quickLink}>
              <Text style={styles.quickLinkIcon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickLinkLabel}>{item.label}</Text>
                <Text style={styles.quickLinkDesc}>{item.desc}</Text>
              </View>
              <Text style={styles.quickLinkArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>App Info</Text>
          <View style={styles.appInfoRow}>
            <Text style={styles.appInfoLabel}>Version</Text>
            <Text style={styles.appInfoValue}>1.0.0</Text>
          </View>
          <View style={styles.appInfoRow}>
            <Text style={styles.appInfoLabel}>Backend</Text>
            <Text style={styles.appInfoValue}>Django REST API</Text>
          </View>
          <View style={styles.appInfoRow}>
            <Text style={styles.appInfoLabel}>Payment</Text>
            <Text style={styles.appInfoValue}>Razorpay</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF8' },
  profileHeader: {
    backgroundColor: '#1B4332', padding: 28, alignItems: 'center',
  },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#52B788',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#fff' },
  fullName: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 2 },
  username: { fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 10 },
  roleBadge: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 5 },
  roleText: { fontSize: 13, fontWeight: '700' },
  card: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1B4332' },
  editBtn: { backgroundColor: '#D8F3DC', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { color: '#1B4332', fontSize: 13, fontWeight: '600' },
  cancelBtn: { backgroundColor: '#FEE2E2', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  cancelBtnText: { color: '#DC2626', fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14,
    color: '#111827', marginBottom: 12, backgroundColor: '#FAFAFA',
  },
  saveBtn: { backgroundColor: '#2D6A4F', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6' },
  infoIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  infoLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  infoValue: { fontSize: 14, color: '#1B4332', fontWeight: '500', marginTop: 2 },
  quickLink: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6' },
  quickLinkIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  quickLinkLabel: { fontSize: 14, fontWeight: '600', color: '#1B4332' },
  quickLinkDesc: { fontSize: 12, color: '#6B7F6B', marginTop: 1 },
  quickLinkArrow: { fontSize: 22, color: '#D1D5DB', fontWeight: '300' },
  appInfoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6' },
  appInfoLabel: { fontSize: 13, color: '#6B7F6B' },
  appInfoValue: { fontSize: 13, fontWeight: '600', color: '#1B4332' },
  logoutBtn: { margin: 12, backgroundColor: '#FEE2E2', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
  logoutText: { color: '#DC2626', fontSize: 16, fontWeight: '700' },
});
