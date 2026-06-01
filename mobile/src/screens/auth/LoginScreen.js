import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!form.username.trim() || !form.password.trim()) {
      Alert.alert('Missing Fields', 'Please enter username and password');
      return;
    }
    setLoading(true);
    try {
      await login(form);
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.error || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (username, password) => setForm({ username, password });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

        <View style={styles.hero}>
          <Text style={styles.emoji}>🥦</Text>
          <Text style={styles.appName}>FreshMart</Text>
          <Text style={styles.tagline}>Fresh vegetables, delivered to your door</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSub}>Sign in to continue</Text>

          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter username"
            value={form.username}
            onChangeText={v => setForm({ ...form, username: v })}
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Enter password"
              value={form.password}
              onChangeText={v => setForm({ ...form, password: v })}
              secureTextEntry={!showPass}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Text style={styles.eyeIcon}>{showPass ? '👁' : '🙈'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.loginBtnText}>Sign In</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerText}>
              New customer? <Text style={styles.registerBold}>Create account</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>🧪 Demo Accounts (tap to fill)</Text>
          {[
            { role: 'Admin', user: 'admin', pass: 'admin123', color: '#7C3AED', bg: '#EDE9FE' },
            { role: 'Customer', user: 'customer', pass: 'pass123', color: '#2D6A4F', bg: '#D8F3DC' },
            { role: 'Delivery', user: 'delivery', pass: 'pass123', color: '#EA580C', bg: '#FEF0E7' },
          ].map(item => (
            <TouchableOpacity
              key={item.role}
              style={[styles.demoRow, { backgroundColor: item.bg }]}
              onPress={() => fillDemo(item.user, item.pass)}>
              <Text style={[styles.demoRole, { color: item.color }]}>{item.role}</Text>
              <Text style={[styles.demoCred, { color: item.color }]}>{item.user} / {item.pass}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B4332' },
  inner: { flexGrow: 1, padding: 20, paddingTop: 60 },
  hero: { alignItems: 'center', marginBottom: 28 },
  emoji: { fontSize: 72, marginBottom: 10 },
  appName: { fontSize: 38, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 6, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 24, marginBottom: 16 },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#1B4332', marginBottom: 4 },
  cardSub: { fontSize: 14, color: '#6B7F6B', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: '#111827', marginBottom: 14, backgroundColor: '#FAFAFA',
  },
  passRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  eyeBtn: { padding: 12, backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB' },
  eyeIcon: { fontSize: 16 },
  loginBtn: {
    backgroundColor: '#2D6A4F', borderRadius: 14,
    padding: 16, alignItems: 'center', marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  registerLink: { alignItems: 'center', marginTop: 16 },
  registerText: { fontSize: 14, color: '#6B7280' },
  registerBold: { color: '#2D6A4F', fontWeight: '700' },
  demoCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16 },
  demoTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', marginBottom: 10 },
  demoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8,
  },
  demoRole: { fontSize: 14, fontWeight: '700' },
  demoCred: { fontSize: 13, fontWeight: '500' },
});
