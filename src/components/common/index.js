// ─────────────────────────────────────────────────────────────────────────────
// Common UI Components — all in one file for easy imports
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography, spacing, radius } from '../../theme/index';

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({
  title, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false, icon, style, textStyle,
}) {
  const variantStyles = {
    primary:   { bg: colors.primary,  text: colors.white,        border: colors.primary },
    secondary: { bg: colors.bgMid,    text: colors.textSecondary, border: colors.border },
    ghost:     { bg: 'transparent',   text: colors.textMuted,     border: colors.border },
    danger:    { bg: colors.error,    text: colors.white,         border: colors.error },
    success:   { bg: colors.success,  text: colors.white,         border: colors.success },
    outline:   { bg: 'transparent',   text: colors.primary,       border: colors.primary },
  };
  const sizeStyles = {
    sm: { paddingVertical: 7,  paddingHorizontal: 14, fontSize: 13 },
    md: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 15 },
    lg: { paddingVertical: 15, paddingHorizontal: 28, fontSize: 16 },
  };

  const vs = variantStyles[variant];
  const ss = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        btnStyles.base,
        { backgroundColor: vs.bg, borderColor: vs.border, paddingVertical: ss.paddingVertical, paddingHorizontal: ss.paddingHorizontal },
        isDisabled && btnStyles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vs.text} />
      ) : (
        <View style={btnStyles.inner}>
          {icon && <Ionicons name={icon} size={ss.fontSize + 2} color={vs.text} style={{ marginRight: 6 }} />}
          <Text style={[btnStyles.text, { color: vs.text, fontSize: ss.fontSize }, textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const btnStyles = StyleSheet.create({
  base:     { borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  inner:    { flexDirection: 'row', alignItems: 'center' },
  text:     { fontWeight: '700' },
  disabled: { opacity: 0.5 },
});

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({
  label, placeholder, value, onChangeText, secureTextEntry = false,
  multiline = false, numberOfLines = 1, keyboardType = 'default',
  error, editable = true, icon, style,
}) {
  const [focused, setFocused] = useState(false);
  const [show,    setShow]    = useState(false);

  return (
    <View style={[inputStyles.wrapper, style]}>
      {label && <Text style={inputStyles.label}>{label}</Text>}
      <View style={[
        inputStyles.container,
        focused && inputStyles.focused,
        !!error  && inputStyles.errorBorder,
        !editable && inputStyles.disabled,
      ]}>
        {icon && <Ionicons name={icon} size={18} color={colors.textMuted} style={{ marginRight: 8 }} />}
        <TextInput
          style={[inputStyles.input, multiline && { height: numberOfLines * 40, textAlignVertical: 'top' }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !show}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          keyboardType={keyboardType}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShow(!show)}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={inputStyles.errorText}>{error}</Text>}
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrapper:     { marginBottom: spacing.md },
  label:       { ...typography.label, color: colors.textMuted, marginBottom: 6 },
  container:   { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgInput, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 2 },
  focused:     { borderColor: colors.primary },
  errorBorder: { borderColor: colors.error },
  disabled:    { opacity: 0.6 },
  input:       { flex: 1, color: colors.textSecondary, fontSize: 14, paddingVertical: 11 },
  errorText:   { color: colors.error, fontSize: 12, marginTop: 4 },
});

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style, onPress }) {
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[cardStyles.card, style]}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[cardStyles.card, style]}>{children}</View>;
}

const cardStyles = StyleSheet.create({
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
});

// ── Badge / Status Tag ────────────────────────────────────────────────────────
export function Badge({ status, label, size = 'sm' }) {
  const map = {
    open:       { text: 'OPEN',        color: colors.success,  bg: colors.tagOpenBg },
    in_progress:{ text: 'IN PROGRESS', color: colors.warning,  bg: colors.tagProgressBg },
    completed:  { text: 'COMPLETED',   color: colors.info,     bg: colors.tagCompletedBg },
    cancelled:  { text: 'CANCELLED',   color: colors.error,    bg: colors.tagClosedBg },
    pending:    { text: 'PENDING',     color: colors.warning,  bg: colors.tagProgressBg },
    accepted:   { text: 'ACCEPTED',    color: colors.success,  bg: colors.tagOpenBg },
    declined:   { text: 'DECLINED',    color: colors.error,    bg: colors.tagClosedBg },
    ordered:    { text: 'ORDERED',     color: colors.info,     bg: colors.tagCompletedBg },
    normal:     { text: 'HOMEOWNER',   color: colors.success,  bg: colors.tagOpenBg },
    skilled:    { text: 'SKILLED PRO', color: colors.info,     bg: '#1B2A3A' },
    admin:      { text: 'ADMIN',       color: colors.warning,  bg: colors.tagProgressBg },
  };
  const s = map[status] || { text: label || status?.toUpperCase(), color: colors.textMuted, bg: colors.bgMid };
  const fs = size === 'sm' ? 11 : 13;

  return (
    <View style={{ backgroundColor: s.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full }}>
      <Text style={{ color: s.color, fontSize: fs, fontWeight: '700' }}>{label || s.text}</Text>
    </View>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ uri, name = '', size = 44, style }) {
  if (uri) {
    return <Image source={{ uri }} style={[{ width: size, height: size, borderRadius: size / 2 }, style]} />;
  }
  const initial = name?.[0]?.toUpperCase() || '?';
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Text style={{ color: colors.white, fontWeight: '800', fontSize: size * 0.38 }}>{initial}</Text>
    </View>
  );
}

// ── StarRating ────────────────────────────────────────────────────────────────
export function StarRating({ rating = 0, size = 16, interactive = false, onRate, count }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <TouchableOpacity key={s} disabled={!interactive} onPress={() => onRate && onRate(s)}>
          <Ionicons name={s <= Math.round(rating) ? 'star' : 'star-outline'} size={size} color={s <= Math.round(rating) ? colors.warning : colors.textFaint} />
        </TouchableOpacity>
      ))}
      {count !== undefined && (
        <Text style={{ color: colors.textMuted, fontSize: 12, marginLeft: 4 }}>({count})</Text>
      )}
    </View>
  );
}

// ── LoadingSpinner ────────────────────────────────────────────────────────────
export function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message && <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}>{message}</Text>}
    </View>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon = 'document-outline', title, subtitle, actionLabel, onAction }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
      <Ionicons name={icon} size={64} color={colors.textFaint} />
      <Text style={{ ...typography.h3, color: colors.textPrimary, marginTop: spacing.md, textAlign: 'center' }}>{title}</Text>
      {subtitle && <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} style={{ marginTop: spacing.lg }} />
      )}
    </View>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, action, onAction }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm, marginTop: spacing.md }}>
      <Text style={{ ...typography.h3, color: colors.textPrimary }}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ style }) {
  return <View style={[{ height: 1, backgroundColor: colors.border, marginVertical: spacing.md }, style]} />;
}

// ── Error Banner ──────────────────────────────────────────────────────────────
export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <View style={{ backgroundColor: '#2A1A1A', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.error }}>
      <Text style={{ color: colors.error, fontSize: 13 }}>{message}</Text>
    </View>
  );
}
