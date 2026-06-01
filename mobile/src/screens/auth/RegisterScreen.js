import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    username: '', email: '', password: '',
    first_name: '', last_name: '', phone: '', role: 'customer',
  });
  const [loading, setLoading] = useState(false);

  const set = (key) => (val) => setForm({ ...form, [key]: val });

  const handleRegister = async () => {
    if (!form.username || !form.email || !form.password) {
      Alert.alert('Missing Fields', 'Username, email and password are required');
      return;
    }
    setLoading(true);
    try {
      await register(form);
    } catch (err) {
      const errors = err.response?.data;
      const msg = errors
        ? Object.values(errors).flat().join('\n')
        : 'Registration failed. Try again.';
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.emoji}>🛒</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join FreshMart today</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>First Name</Text>
              <TextInput style={styles.input} placeholder="First name" value={form.first_name} onChangeText={set('first_name')} placeholderTextColor="#9CA3AF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput style={styles.input} placeholder="Last name" value={form.last_name} onChangeText={set('last_name')} placeholderTextColor="#9CA3AF" />
            </View>
          </View>

          <Text style={styles.label}>Username *</Text>
          <TextInput style={styles.input} placeholder="Choose username" value={form.username} onChangeText={set('username')} autoCapitalize="none" placeholderTextColor="#9CA3AF" />

          <Text style={styles.label}>Email *</Text>
          <TextInput style={styles.input} placeholder="your@email.com" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#9CA3AF" />

          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} placeholder="+91 9999999999" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholderTextColor="#9CA3AF" />

          <Text style={styles.label}>Password *</Text>
          <TextInput style={styles.input} placeholder="Min 6 characters" value={form.password} onChangeText={set('password')} secureTextEntry placeholderTextColor="#9CA3AF" />

          <Text style={styles.label}>Register as</Text>
          <View style={styles.roleRow}>
            {[
              { value: 'customer', label: '🛒 Customer' },
              { value: 'delivery', label: '🚴 Delivery Partner' },
            ].map(opt => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setForm({ ...form, role: opt.value })}
                style={[styles.roleBtn, form.role === opt.value && styles.roleBtnActive]}>
                <Text style={[styles.roleBtnText, form.role === opt.value && styles.roleBtnTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.registerBtn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.registerBtnText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
            <Text style={styles.loginText}>Already have an account? <Text style={styles.loginBold}>Sign in</Text></Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B4332' },
  inner: { flexGrow: 1, padding: 20, paddingTop: 56 },
  header: { alignItems: 'center', marginBottom: 24 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 16 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 15 },
  emoji: { fontSize: 52, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 24 },
  row: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: '#111827', marginBottom: 12, backgroundColor: '#FAFAFA',
  },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  roleBtn: {
    flex: 1, padding: 12, borderRadius: 12, borderWidth: 1.5,
    borderColor: '#E5E7EB', alignItems: 'center', backgroundColor: '#FAFAFA',
  },
  roleBtnActive: { borderColor: '#2D6A4F', backgroundColor: '#D8F3DC' },
  roleBtnText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  roleBtnTextActive: { color: '#1B4332' },
  registerBtn: {
    backgroundColor: '#2D6A4F', borderRadius: 14, padding: 16, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginLink: { alignItems: 'center', marginTop: 16 },
  loginText: { fontSize: 14, color: '#6B7280' },
  loginBold: { color: '#2D6A4F', fontWeight: '700' },
});
