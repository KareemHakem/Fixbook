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
import { Ionicons } from '@expo/vector-icons';
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
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <View style={styles.hero}>
            <Image source={require('../../../assets/kareem edit.png')} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.tagline}>{t('auth.tagline')}</Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <ErrorBanner message={error} />

            <Input label={t('auth.email')} placeholder={t('auth.emailPlaceholder')} value={email} onChangeText={setEmail} keyboardType="email-address" icon="mail-outline" />
            <Input label={t('auth.password')} placeholder={t('auth.passwordHidden')} value={password} onChangeText={setPassword} secureTextEntry icon="lock-closed-outline" />

            <Button title={t('auth.signIn')} onPress={handleLogin} loading={loading} size="lg" style={styles.btn} />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.switchRow}>
              <Text style={styles.switchText}>{t('auth.noAccountQ')} </Text>
              <Text style={styles.switchLink}>{t('auth.register')}</Text>
            </TouchableOpacity>
          </View>

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
    if (err) { setError(err.message); console.log('Registration result:', err); }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <View style={styles.hero}>
            <Image source={require('../../../assets/kareem edit.png')} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.tagline}>{t('auth.createAccount')}</Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>

            {/* Role selector */}
            <Text style={styles.roleLabel}>{t('auth.iAmA')}</Text>
            <View style={styles.roleRow}>
              {[
                { id: 'normal',  label: t('auth.homeowner'),  sub: t('auth.homeownerSub'),  icon: 'home-outline' },
                { id: 'skilled', label: t('auth.skilledPro'), sub: t('auth.skilledProSub'), icon: 'construct-outline' },
              ].map((r) => (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => setRole(r.id)}
                  style={[styles.roleCard, role === r.id && styles.roleCardActive]}
                >
                  <View style={styles.roleCardTop}>
                    <Ionicons name={r.icon} size={22} color={role === r.id ? colors.primary : colors.textMuted} />
                    <Text style={[styles.roleCardLabel, role === r.id && { color: colors.primary }]}>{r.label}</Text>
                  </View>
                  <Text style={styles.roleCardSub}>{r.sub}</Text>
                  {role === r.id && <View style={styles.roleActiveDot} />}
                </TouchableOpacity>
              ))}
            </View>

            <ErrorBanner message={error} />

            <Input label={t('auth.fullName')}        placeholder={t('auth.yourFullName')}     value={fullName} onChangeText={setFullName} icon="person-outline" />
            <Input label={t('auth.email')}           placeholder={t('auth.emailPlaceholder')} value={email}    onChangeText={setEmail}    icon="mail-outline"   keyboardType="email-address" />
            <Input label={t('auth.password')}        placeholder={t('auth.min6Chars')}        value={password} onChangeText={setPassword} icon="lock-closed-outline" secureTextEntry />
            <Input label={t('auth.confirmPassword')} placeholder={t('auth.repeatPassword')}   value={confirm}  onChangeText={setConfirm}  icon="lock-closed-outline" secureTextEntry />

            <Button title={t('auth.signUp')} onPress={handleRegister} loading={loading} size="lg" style={styles.btn} />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.switchRow}>
              <Text style={styles.switchText}>{t('auth.haveAccountQ')} </Text>
              <Text style={styles.switchLink}>{t('auth.signIn')}</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  container: { paddingBottom: spacing.xl, justifyContent: 'center' },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    overflow: 'hidden',
  },
  logoImage: {
    width: 280,
    height: 280,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 6,
  },

  // ── Form card ─────────────────────────────────────────────────────────────
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },

  btn: { marginTop: spacing.md },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    gap: spacing.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textFaint, fontSize: 12 },

  switchRow:  { flexDirection: 'row', justifyContent: 'center', paddingTop: 2 },
  switchText: { color: colors.textMuted, fontSize: 14 },
  switchLink: { color: colors.primary, fontSize: 14, fontWeight: '700' },

  // ── Role selector ─────────────────────────────────────────────────────────
  roleLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  roleCard: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'flex-start',
  },
  roleCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#1F1800',
  },
  roleCardLabel: { fontWeight: '700', color: colors.textSecondary, fontSize: 14 },
  roleCardSub:   { color: colors.textFaint, fontSize: 11, paddingLeft: 30 },
  roleActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 8,
  },
});
