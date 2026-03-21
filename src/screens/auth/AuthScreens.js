// ─────────────────────────────────────────────────────────────────────────────
// LoginScreen.js
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, ErrorBanner } from '../../components/common';
import { colors } from '../../theme/colors';
import { spacing, typography, radius } from '../../theme/index';

export function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setError(''); setLoading(true);
    const { error: err } = await signIn({ email, password });
    if (err) setError(err.message);
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoWrap}>
            <Text style={styles.logo}>FIXIT</Text>
            <Text style={styles.tagline}>Home Repair Marketplace</Text>
          </View>

          <ErrorBanner message={error} />

          <Input label="Email" placeholder="you@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" icon="mail-outline" />
          <Input label="Password" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry icon="lock-closed-outline" />

          <Button title="Sign In" onPress={handleLogin} loading={loading} size="lg" style={{ marginTop: spacing.sm }} />

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.switchRow}>
            <Text style={styles.switchText}>Don't have an account? </Text>
            <Text style={styles.switchLink}>Register</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RegisterScreen.js
// ─────────────────────────────────────────────────────────────────────────────
export function RegisterScreen({ navigation }) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [role,     setRole]     = useState('normal');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirm) { setError('Please fill in all fields.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return; }
    setError(''); setLoading(true);
    const { error: err } = await signUp({ email, password, fullName, role });
    if (err) setError(err.message);
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <Text style={styles.logo}>FIXIT</Text>
            <Text style={styles.tagline}>Create your account</Text>
          </View>

          {/* Role selector */}
          <Text style={styles.roleLabel}>I am a...</Text>
          <View style={styles.roleRow}>
            {[
              { id: 'normal',  label: '🏠 Homeowner',   sub: 'Post jobs & find help' },
              { id: 'skilled', label: '🔧 Skilled Pro',  sub: 'Find jobs & earn money' },
            ].map((r) => (
              <TouchableOpacity
                key={r.id}
                onPress={() => setRole(r.id)}
                style={[styles.roleCard, role === r.id && styles.roleCardActive]}
              >
                <Text style={[styles.roleCardLabel, role === r.id && { color: colors.primary }]}>{r.label}</Text>
                <Text style={styles.roleCardSub}>{r.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ErrorBanner message={error} />

          <Input label="Full Name"        placeholder="Your full name"  value={fullName} onChangeText={setFullName} icon="person-outline" />
          <Input label="Email"            placeholder="you@email.com"   value={email}    onChangeText={setEmail}    icon="mail-outline"   keyboardType="email-address" />
          <Input label="Password"         placeholder="Min 6 characters" value={password} onChangeText={setPassword} icon="lock-closed-outline" secureTextEntry />
          <Input label="Confirm Password" placeholder="Repeat password" value={confirm}  onChangeText={setConfirm}  icon="lock-closed-outline" secureTextEntry />

          <Button title="Create Account" onPress={handleRegister} loading={loading} size="lg" style={{ marginTop: spacing.sm }} />

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account? </Text>
            <Text style={styles.switchLink}>Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: colors.bg },
  container:       { padding: spacing.lg, paddingTop: spacing.xl },
  logoWrap:        { alignItems: 'center', marginBottom: spacing.xl },
  logo:            { fontSize: 52, fontWeight: '900', color: colors.primary, letterSpacing: 4 },
  tagline:         { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  roleLabel:       { ...typography.label, color: colors.textMuted, marginBottom: spacing.sm },
  roleRow:         { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  roleCard:        { flex: 1, backgroundColor: colors.bgInput, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  roleCardActive:  { borderColor: colors.primary, backgroundColor: '#1F1800' },
  roleCardLabel:   { fontWeight: '700', color: colors.textSecondary, fontSize: 14 },
  roleCardSub:     { color: colors.textFaint, fontSize: 11, marginTop: 3 },
  switchRow:       { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  switchText:      { color: colors.textMuted, fontSize: 14 },
  switchLink:      { color: colors.primary, fontSize: 14, fontWeight: '700' },
});
