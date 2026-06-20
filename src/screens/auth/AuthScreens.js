// ─────────────────────────────────────────────────────────────────────────────
// LoginScreen.js
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import { Button, Input, ErrorBanner } from '../../components/common';
import { colors } from '../../theme/colors';
import { spacing, typography, radius } from '../../theme/index';

export function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const { t } = useTranslation();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleLogin = async () => {
    if (!email || !password) { setError(t('common.fillAllFields')); return; }
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
            <Image source={require('../../../assets/icon.png')} style={styles.logoImage} resizeMode="contain" />
             <Text style={styles.logo}>FIXBOOK</Text>
            <Text style={styles.tagline}>{t('auth.tagline')}</Text>
          </View>

          <ErrorBanner message={error} />

          <Input label={t('auth.email')} placeholder={t('auth.emailPlaceholder')} value={email} onChangeText={setEmail} keyboardType="email-address" icon="mail-outline" />
          <Input label={t('auth.password')} placeholder={t('auth.passwordHidden')} value={password} onChangeText={setPassword} secureTextEntry icon="lock-closed-outline" />

          <Button title={t('auth.signIn')} onPress={handleLogin} loading={loading} size="lg" style={{ marginTop: spacing.sm }} />

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.switchRow}>
            <Text style={styles.switchText}>{t('auth.noAccountQ')}</Text>
            <Text style={styles.switchLink}>{t('auth.register')}</Text>
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
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [role,     setRole]     = useState('normal');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirm) { setError(t('common.fillAllFields')); return; }
    if (password !== confirm) { setError(t('auth.passwordsMismatch')); return; }
    if (password.length < 6)  { setError(t('auth.passwordTooShort')); return; }
    setError(''); setLoading(true);
    const { error: err } = await signUp({ email, password, fullName, role });
    if (err) {setError(err.message);
    console.log('Registration result:',  err );}
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <Text style={styles.logo}>FIXBOOK</Text>
            <Text style={styles.tagline}>{t('auth.createAccount')}</Text>
          </View>

          {/* Role selector */}
          <Text style={styles.roleLabel}>{t('auth.iAmA')}</Text>
          <View style={styles.roleRow}>
            {[
              { id: 'normal',  label: t('auth.homeowner'),  sub: t('auth.homeownerSub') },
              { id: 'skilled', label: t('auth.skilledPro'), sub: t('auth.skilledProSub') },
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

          <Input label={t('auth.fullName')}        placeholder={t('auth.yourFullName')}     value={fullName} onChangeText={setFullName} icon="person-outline" />
          <Input label={t('auth.email')}           placeholder={t('auth.emailPlaceholder')} value={email}    onChangeText={setEmail}    icon="mail-outline"   keyboardType="email-address" />
          <Input label={t('auth.password')}        placeholder={t('auth.min6Chars')}        value={password} onChangeText={setPassword} icon="lock-closed-outline" secureTextEntry />
          <Input label={t('auth.confirmPassword')} placeholder={t('auth.repeatPassword')}   value={confirm}  onChangeText={setConfirm}  icon="lock-closed-outline" secureTextEntry />

          <Button title={t('auth.signUp')} onPress={handleRegister} loading={loading} size="lg" style={{ marginTop: spacing.sm }} />

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.switchRow}>
            <Text style={styles.switchText}>{t('auth.haveAccountQ')}</Text>
            <Text style={styles.switchLink}>{t('auth.signIn')}</Text>
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
  logoImage:       { width: 120, height: 120 },
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
