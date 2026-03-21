import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Avatar, StarRating, Badge, Button } from '../common';
import { colors } from '../../theme/colors';
import { typography, spacing, radius } from '../../theme/index';

export default function OfferCard({
  offer,
  isPostOwner,
  hasActiveOrder,
  onOrder,
  onStartChat,
  onEdit,
  onDelete,
  currentUserId,
}) {
  const skilledUser    = offer.skilled_user || {};
  const skilledProfile = offer.skilled_profiles || {};
  const isMyOffer      = offer.skilled_user_id === currentUserId;

  return (
    <Card style={styles.card}>
      {/* Top: avatar + name + rating */}
      <View style={styles.header}>
        <Avatar uri={skilledUser.avatar_url} name={skilledUser.full_name} size={46} />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{skilledUser.full_name}</Text>
          <StarRating rating={skilledProfile.rating || 0} size={13} count={skilledProfile.review_count} />
          {skilledProfile.skills?.length > 0 && (
            <Text style={styles.skills} numberOfLines={1}>{skilledProfile.skills.join(' · ')}</Text>
          )}
        </View>
        <View style={styles.price}>
          <Text style={styles.priceLabel}>€</Text>
          <Text style={styles.priceValue}>{Number(offer.price).toFixed(0)}</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description}>{offer.description}</Text>

      {/* Status badge if not pending */}
      {offer.status !== 'pending' && (
        <View style={{ marginBottom: spacing.sm }}>
          <Badge status={offer.status} />
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {/* Normal user sees: Order + Chat (only if post is open and no active order) */}
        {isPostOwner && !isMyOffer && (
          <>
            {!hasActiveOrder && offer.status === 'pending' && (
              <Button title="Order" onPress={() => onOrder(offer)} size="sm" icon="checkmark-circle-outline" style={{ flex: 1, marginRight: spacing.sm }} />
            )}
            <Button title="Chat" onPress={() => onStartChat(offer)} variant="secondary" size="sm" icon="chatbubble-outline" style={{ flex: 1 }} />
          </>
        )}

        {/* Skilled user sees edit/delete only on their own pending offer */}
        {isMyOffer && offer.status === 'pending' && (
          <>
            <Button title="Edit" onPress={() => onEdit(offer)} variant="outline" size="sm" icon="pencil-outline" style={{ flex: 1, marginRight: spacing.sm }} />
            <Button title="Delete" onPress={() => onDelete(offer)} variant="ghost" size="sm" icon="trash-outline" style={{ flex: 1 }} />
          </>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card:        { marginBottom: spacing.sm },
  header:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  headerInfo:  { flex: 1, marginLeft: spacing.sm },
  name:        { ...typography.h4, color: colors.textPrimary, marginBottom: 3 },
  skills:      { color: colors.textFaint, fontSize: 11, marginTop: 3 },
  price:       { alignItems: 'flex-end' },
  priceLabel:  { color: colors.primary, fontSize: 13, fontWeight: '700' },
  priceValue:  { color: colors.primary, fontSize: 26, fontWeight: '800', lineHeight: 30 },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginBottom: spacing.md },
  actions:     { flexDirection: 'row' },
});
