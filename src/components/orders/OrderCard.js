import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge, Avatar, Button } from '../common';
import { colors } from '../../theme/colors';
import { typography, spacing, radius } from '../../theme/index';

export default function OrderCard({
  order,
  viewAs,           // 'normal' | 'skilled'
  onAccept,
  onDecline,
  onComplete,
  onReview,
}) {
  const isSkilled = viewAs === 'skilled';
  const otherUser = isSkilled ? order.normal_user : order.skilled_user;
  const price     = order.offers?.price;

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Avatar uri={otherUser?.avatar_url} name={otherUser?.full_name} size={44} />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{otherUser?.full_name}</Text>
          <Text style={styles.postTitle} numberOfLines={1}>{order.posts?.title}</Text>
        </View>
        <Badge status={order.status} />
      </View>

      {/* Details grid */}
      <View style={styles.grid}>
        <DetailRow icon="calendar-outline"  label="Date"     value={order.scheduled_date} />
        <DetailRow icon="time-outline"      label="Time"     value={order.scheduled_time?.slice(0, 5)} />
        <DetailRow icon="call-outline"      label="Phone"    value={order.contact_phone} />
        <DetailRow icon="location-outline"  label="Location" value={order.location} />
        {price && <DetailRow icon="cash-outline" label="Price" value={`€${Number(price).toFixed(0)}`} valueColor={colors.primary} />}
      </View>

      {/* Description */}
      {order.offers?.description && (
        <Text style={styles.offerDesc} numberOfLines={2}>{order.offers.description}</Text>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {/* Skilled user: pending → accept or decline */}
        {isSkilled && order.status === 'pending' && (
          <>
            <Button title="Accept"  onPress={() => onAccept(order)}  size="sm" variant="success" icon="checkmark-outline" style={{ flex: 1, marginRight: 8 }} />
            <Button title="Decline" onPress={() => onDecline(order)} size="sm" variant="danger"  icon="close-outline"    style={{ flex: 1 }} />
          </>
        )}
        {/* Skilled user: accepted → mark complete */}
        {isSkilled && order.status === 'accepted' && (
          <Button title="Mark as Completed" onPress={() => onComplete(order)} size="sm" variant="outline" icon="checkmark-done-outline" style={{ flex: 1 }} />
        )}
        {/* Normal user: completed + no review yet → leave review */}
        {!isSkilled && order.status === 'completed' && !order.review_left && (
          <Button title="Leave Review" onPress={() => onReview(order)} size="sm" icon="star-outline" style={{ flex: 1 }} />
        )}
        {!isSkilled && order.status === 'completed' && order.review_left && (
          <View style={styles.reviewedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={{ color: colors.success, fontSize: 13, marginLeft: 5 }}>Review submitted</Text>
          </View>
        )}
      </View>
    </Card>
  );
}

function DetailRow({ icon, label, value, valueColor }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={14} color={colors.textFaint} />
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={[styles.detailValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card:        { marginBottom: spacing.sm },
  header:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  headerInfo:  { flex: 1, marginLeft: spacing.sm },
  name:        { ...typography.h4, color: colors.textPrimary },
  postTitle:   { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  grid:        { backgroundColor: colors.bgInput, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm },
  detailRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  detailLabel: { color: colors.textMuted, fontSize: 12, marginLeft: 5, width: 64 },
  detailValue: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', flex: 1 },
  offerDesc:   { color: colors.textMuted, fontSize: 12, marginBottom: spacing.sm, fontStyle: 'italic' },
  actions:     { flexDirection: 'row', marginTop: spacing.sm },
  reviewedBadge:{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
});
