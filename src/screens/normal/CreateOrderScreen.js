import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card, Avatar, ErrorBanner } from '../../components/common';
import { createOrder } from '../../services/orderService';
import { colors } from '../../theme/colors';
import { spacing, typography, radius } from '../../theme/index';

export function CreateOrderScreen({ route, navigation }) {
  const { offer, post } = route.params;
  const { user, profile } = useAuth();

  const [date,    setDate]    = useState(new Date());
  const [time,    setTime]    = useState(new Date());
  const [phone,   setPhone]   = useState(profile?.phone || '');
  const [location, setLocation] = useState(profile?.address || '');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const fmtDate = (d) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  const fmtTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isoDate = (d) => d.toISOString().split('T')[0];
  const isoTime = (d) => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;

  const handleSubmit = async () => {
    if (!phone.trim() || !location.trim()) { setError('Phone and location are required.'); return; }
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (selectedDate < today) { setError('Please select a future date.'); return; }

    setLoading(true); setError('');
    const { data, error: err } = await createOrder({
      postId:         post.id,
      offerId:        offer.id,
      normalUserId:   user.id,
      skilledUserId:  offer.skilled_user_id,
      scheduledDate:  isoDate(date),
      scheduledTime:  isoTime(time),
      contactPhone:   phone.trim(),
      location:       location.trim(),
    });

    if (err) {
      // Unique constraint violation = active order already exists
      setError(err.code === '23505' ? 'You already have an active order for this post.' : err.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    Alert.alert('Order Placed!', 'Your order has been sent to the skilled pro. They will accept or decline shortly.', [
      { text: 'View My Orders', onPress: () => navigation.navigate('Orders') },
      { text: 'OK', onPress: () => navigation.navigate('PostsList') },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Confirm Order</Text>

        {/* Offer summary */}
        <Card style={{ borderColor: colors.primary + '44', marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <Avatar uri={offer.skilled_user?.avatar_url} name={offer.skilled_user?.full_name} size={44} />
            <View style={{ marginLeft: spacing.sm, flex: 1 }}>
              <Text style={styles.proName}>{offer.skilled_user?.full_name}</Text>
              <Text style={styles.postTitle} numberOfLines={1}>{post.title}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.price}>€{Number(offer.price).toFixed(0)}</Text>
              <Text style={{ color: colors.textFaint, fontSize: 11 }}>agreed price</Text>
            </View>
          </View>
          <Text style={styles.offerDesc}>{offer.description}</Text>
        </Card>

        <ErrorBanner message={error} />

        {/* Date */}
        <Text style={styles.label}>Scheduled Date *</Text>
        <Button
          title={fmtDate(date)}
          onPress={() => setShowDatePicker(true)}
          variant="secondary"
          icon="calendar-outline"
          style={{ marginBottom: spacing.md, justifyContent: 'flex-start' }}
        />
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            minimumDate={new Date()}
            onChange={(_, d) => { setShowDatePicker(Platform.OS === 'ios'); if (d) setDate(d); }}
            themeVariant="dark"
          />
        )}

        {/* Time */}
        <Text style={styles.label}>Scheduled Time *</Text>
        <Button
          title={fmtTime(time)}
          onPress={() => setShowTimePicker(true)}
          variant="secondary"
          icon="time-outline"
          style={{ marginBottom: spacing.md, justifyContent: 'flex-start' }}
        />
        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            onChange={(_, t) => { setShowTimePicker(Platform.OS === 'ios'); if (t) setTime(t); }}
            themeVariant="dark"
          />
        )}

        <Input label="Contact Phone *" placeholder="+370 600 12345" value={phone} onChangeText={setPhone} keyboardType="phone-pad" icon="call-outline" />
        <Input label="Job Location *" placeholder="Full address where work will be done" value={location} onChangeText={setLocation} multiline numberOfLines={2} icon="location-outline" />

        <Button title="Confirm & Place Order" onPress={handleSubmit} loading={loading} size="lg" icon="checkmark-circle-outline" style={{ marginTop: spacing.sm }} />
        <Button title="Cancel" onPress={() => navigation.goBack()} variant="ghost" style={{ marginTop: spacing.sm }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  title:     { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.lg },
  label:     { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  proName:   { fontWeight: '700', color: colors.textPrimary, fontSize: 15 },
  postTitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  price:     { color: colors.primary, fontWeight: '800', fontSize: 22 },
  offerDesc: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
});
