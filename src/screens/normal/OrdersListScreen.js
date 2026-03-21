import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import OrderCard from '../../components/orders/OrderCard';
import { LoadingSpinner, EmptyState } from '../../components/common';
import {
  getNormalUserOrders, getSkilledUserOrders, updateOrderStatus,
} from '../../services/orderService';
import { colors } from '../../theme/colors';
import { spacing, radius, typography } from '../../theme/index';

export function OrdersListScreen({ navigation }) {
  const { user, profile } = useAuth();
  const isSkilled   = profile?.role === 'skilled';
  const [orders,    setOrders]    = useState([]);
  const [tab,       setTab]       = useState('active');   // active | completed
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const fetchFn = isSkilled ? getSkilledUserOrders : getNormalUserOrders;
    const { data } = await fetchFn(user.id);
    if (data) setOrders(data);
    setLoading(false);
    setRefreshing(false);
  }, [user.id, isSkilled]);

  useEffect(() => { load(); }, [load]);

  const activeStatuses    = ['pending', 'accepted'];
  const completedStatuses = ['completed', 'declined', 'cancelled'];
  const filtered = orders.filter(o =>
    tab === 'active' ? activeStatuses.includes(o.status) : completedStatuses.includes(o.status),
  );

  const confirmAction = (msg, onConfirm) =>
    Alert.alert('Confirm', msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', onPress: onConfirm },
    ]);

  const handleAccept = (order) =>
    confirmAction('Accept this order?', async () => {
      await updateOrderStatus(order.id, 'accepted'); load();
    });

  const handleDecline = (order) =>
    confirmAction('Decline this order?', async () => {
      await updateOrderStatus(order.id, 'declined'); load();
    });

  const handleComplete = (order) =>
    confirmAction('Mark this job as completed?', async () => {
      await updateOrderStatus(order.id, 'completed'); load();
    });

  const handleReview = (order) =>
    navigation.navigate('LeaveReview', { order });

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { id: 'active',    label: 'Active' },
          { id: 'completed', label: 'History' },
        ].map((t) => (
          <View key={t.id} style={[styles.tab, tab === t.id && styles.tabActive]}>
            <Text
              onPress={() => setTab(t.id)}
              style={[styles.tabText, tab === t.id && styles.tabTextActive]}
            >
              {t.label}
            </Text>
          </View>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            viewAs={isSkilled ? 'skilled' : 'normal'}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onComplete={handleComplete}
            onReview={handleReview}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="clipboard-outline"
            title={tab === 'active' ? 'No active orders' : 'No order history'}
            subtitle={tab === 'active'
              ? isSkilled ? 'Orders from clients will appear here.' : 'Place an order by choosing an offer on a job post.'
              : 'Completed or declined orders will show here.'}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: colors.bg },
  tabs:          { flexDirection: 'row', margin: spacing.md, backgroundColor: colors.bgInput, borderRadius: radius.lg, padding: 3 },
  tab:           { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: radius.md },
  tabActive:     { backgroundColor: colors.bgCard },
  tabText:       { color: colors.textFaint, fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: colors.primary },
  list:          { padding: spacing.md, paddingTop: 0, paddingBottom: 40 },
});
