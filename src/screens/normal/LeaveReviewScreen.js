import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Avatar, StarRating, Input, ErrorBanner } from '../../components/common';
import { createReview } from '../../services/reviewService';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme/index';

export function LeaveReviewScreen({ route, navigation }) {
  const { order } = route.params;
  const { user }  = useAuth();
  const skilledUser = order.skilled_user || {};

  const [rating,     setRating]     = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const handleSubmit = async () => {
    setLoading(true); setError('');
    const { error: err } = await createReview({
      orderId:       order.id,
      normalUserId:  user.id,
      skilledUserId: order.skilled_user_id,
      rating,
      reviewText:    reviewText.trim() || null,
    });
    if (err) {
      setError(err.code === '23505' ? 'You have already reviewed this order.' : err.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    Alert.alert('Review Submitted!', 'Thank you for your feedback.', [
      { text: 'OK', onPress: () => navigation.navigate('Orders') },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Leave a Review</Text>

        {/* Pro info */}
        <Card style={{ alignItems: 'center', marginBottom: spacing.lg }}>
          <Avatar uri={skilledUser.avatar_url} name={skilledUser.full_name} size={64} />
          <Text style={styles.proName}>{skilledUser.full_name}</Text>
          <Text style={styles.postTitle}>{order.posts?.title}</Text>
        </Card>

        {/* Stars */}
        <Text style={styles.label}>Rating *</Text>
        <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
          <StarRating rating={rating} size={40} interactive onRate={setRating} />
          <Text style={{ color: colors.warning, fontWeight: '700', marginTop: 8, fontSize: 15 }}>
            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
          </Text>
        </View>

        <ErrorBanner message={error} />

        <Input
          label="Written Review (optional)"
          placeholder="Share your experience with this professional..."
          value={reviewText}
          onChangeText={setReviewText}
          multiline
          numberOfLines={4}
        />

        <Button title="Submit Review" onPress={handleSubmit} loading={loading} size="lg" icon="star-outline" style={{ marginTop: spacing.sm }} />
        <Button title="Cancel" onPress={() => navigation.goBack()} variant="ghost" style={{ marginTop: spacing.sm }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: spacing.lg },
  title:     { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.lg, textAlign: 'center' },
  proName:   { ...typography.h3, color: colors.textPrimary, marginTop: spacing.sm },
  postTitle: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  label:     { ...typography.label, color: colors.textMuted, marginBottom: spacing.sm },
});
