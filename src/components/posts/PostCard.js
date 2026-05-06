import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge, Avatar } from '../common';
import { colors } from '../../theme/colors';
import { typography, spacing, radius } from '../../theme/index';

const CATEGORY_ICONS = {
  'Electrician':       'flash-outline',
  'Plumber':           'water-outline',
  'Water Pump Repair': 'settings-outline',
  'HVAC':              'thermometer-outline',
  'Carpentry':         'hammer-outline',
  'Appliance Repair':  'construct-outline',
  'General Handyman':  'build-outline',
  'Painting':          'color-palette-outline',
  'Tiling':            'grid-outline',
  'Welding':           'flame-outline',
};

export default function PostCard({ post, onPress }) {
  const icon = CATEGORY_ICONS[post.category] || 'construct-outline';

  return (
    <Card onPress={onPress} style={styles.card}>
      {/* Image */}
      {post.image_url && (
        <Image source={{ uri: post.image_url }} style={styles.image} />
      )}

      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={styles.title} numberOfLines={1}>{post.title}</Text>
          <View style={styles.meta}>
            <Ionicons name="time-outline" size={12} color={colors.textFaint} />
            <Text style={styles.metaText}>{formatDate(post.created_at)}</Text>
          </View>
        </View>
        <Badge status={post.status} />
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={2}>{post.description}</Text>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Avatar uri={post.profiles?.avatar_url} name={post.profiles?.full_name} size={22} />
          <Text style={styles.ownerText}>{post.profiles?.full_name}</Text>
        </View>
        <View style={styles.offersBadge}>
          <Ionicons name="chatbubble-outline" size={13} color={colors.info} />
          <Text style={[styles.metaText, { color: colors.info, marginLeft: 3 }]}>
            {Math.max(0, post.offers_count || 0)} offer{Math.max(0, post.offers_count || 0) !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    </Card>
  );
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60)       return 'just now';
  if (diff < 3600)     return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)    return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const styles = StyleSheet.create({
  card:        { marginBottom: spacing.sm },
  image:       { width: '100%', height: 140, borderRadius: radius.md, marginBottom: spacing.sm, resizeMode: 'cover' },
  header:      { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  iconWrap:    { width: 40, height: 40, borderRadius: radius.md, backgroundColor: '#1F1800', alignItems: 'center', justifyContent: 'center' },
  title:       { ...typography.h4, color: colors.textPrimary, flex: 1 },
  meta:        { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  metaText:    { color: colors.textFaint, fontSize: 11, marginLeft: 3 },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginBottom: spacing.sm },
  footer:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  footerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ownerText:   { color: colors.textMuted, fontSize: 12 },
  offersBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#14302E', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
});
