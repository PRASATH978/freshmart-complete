import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deliveryAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function DeliveryDashboardScreen() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [st, pr] = await Promise.all([
        deliveryAPI.getStats(),
        deliveryAPI.getProfile(),
      ]);
      setStats(st.data);
      setProfile(pr.data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: logout, style: 'destructive' },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#EA580C" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🚴 FreshMart Delivery</Text>
          <Text style={styles.headerSub}>
            Hey, {user?.first_name || user?.username}! Ready to deliver?
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor="#EA580C"
          />
        }>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Total Assigned', value: stats?.total_assigned || 0, icon: '📦', color: '#3B82F6', bg: '#EFF6FF' },
            { label: 'Delivered', value: stats?.delivered || 0, icon: '✅', color: '#10B981', bg: '#ECFDF5' },
            { label: 'Pending', value: stats?.pending || 0, icon: '⏳', color: '#F97316', bg: '#FFF7ED' },
            { label: 'Rating', value: `${profile?.rating || '5.0'}⭐`, icon: '🌟', color: '#F59E0B', bg: '#FFFBEB' },
          ].map(s => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg, borderLeftColor: s.color }]}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.first_name?.[0] || user?.username?.[0] || 'D').toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.profileName}>
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username}
              </Text>
              <Text style={styles.profileUsername}>@{user?.username}</Text>
              <Text style={styles.profilePhone}>📱 {user?.phone || 'No phone'}</Text>
            </View>
          </View>
          <View style={styles.availBadge}>
            <Text style={styles.availText}>
              {profile?.is_available ? '🟢 Available' : '🔴 Busy'}
            </Text>
          </View>
        </View>

        {/* Vehicle Info */}
        {profile && (
          <View style={styles.vehicleCard}>
            <Text style={styles.vehicleTitle}>🏍 Vehicle Info</Text>
            <View style={styles.vehicleRow}>
              <View style={styles.vehicleItem}>
                <Text style={styles.vehicleLabel}>Type</Text>
                <Text style={styles.vehicleValue}>{profile.vehicle_type || 'Bike'}</Text>
              </View>
              <View style={styles.vehicleItem}>
                <Text style={styles.vehicleLabel}>Number</Text>
                <Text style={styles.vehicleValue}>{profile.vehicle_number || 'Not set'}</Text>
              </View>
              <View style={styles.vehicleItem}>
                <Text style={styles.vehicleLabel}>Total Deliveries</Text>
                <Text style={[styles.vehicleValue, { color: '#EA580C' }]}>{profile.total_deliveries}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Quick Tips</Text>
          {[
            '📱 Always call the customer if you\'re running late',
            '🧾 Collect payment before handing over COD orders',
            '📸 Take a photo if customer is not available',
            '⭐ Be polite to get better ratings!',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF8' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16,
    backgroundColor: '#EA580C',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
  },
  logoutText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 12 },
  statCard: { width: '47.5%', borderRadius: 14, padding: 14, borderLeftWidth: 4 },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#6B7F6B', marginTop: 3, fontWeight: '500' },
  profileCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', margin: 12, marginTop: 0, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#F3F4F6',
  },
  profileLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#FEF0E7', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#EA580C' },
  profileName: { fontSize: 15, fontWeight: '700', color: '#1B4332' },
  profileUsername: { fontSize: 12, color: '#6B7F6B', marginTop: 1 },
  profilePhone: { fontSize: 12, color: '#6B7F6B', marginTop: 1 },
  availBadge: {
    backgroundColor: '#D8F3DC', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  availText: { fontSize: 12, fontWeight: '700', color: '#1B4332' },
  vehicleCard: {
    backgroundColor: '#fff', margin: 12, marginTop: 0, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#F3F4F6',
  },
  vehicleTitle: { fontSize: 15, fontWeight: '700', color: '#1B4332', marginBottom: 14 },
  vehicleRow: { flexDirection: 'row', justifyContent: 'space-around' },
  vehicleItem: { alignItems: 'center' },
  vehicleLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 4 },
  vehicleValue: { fontSize: 15, fontWeight: '700', color: '#1B4332' },
  tipsCard: {
    backgroundColor: '#FFFBEB', margin: 12, marginTop: 0, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#FDE68A',
  },
  tipsTitle: { fontSize: 15, fontWeight: '700', color: '#92400E', marginBottom: 12 },
  tipRow: { paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#FDE68A' },
  tipText: { fontSize: 13, color: '#78350F', lineHeight: 18 },
});
