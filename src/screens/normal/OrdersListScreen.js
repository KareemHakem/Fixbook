import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import OrderCard from '../../components/orders/OrderCard';
import { LoadingSpinner, EmptyState } from '../../components/common';
import {
  getNormalUserOrders, getSkilledUserOrders, updateOrderStatus,
} from '../../services/orderService';
import { updatePost } from '../../services/postService';
import { colors } from '../../theme/colors';
import { spacing, radius, typography } from '../../theme/index';

export function OrdersListScreen({ navigation }) {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
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
    Alert.alert(t('orders.confirmTitle'), msg, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.yes'), onPress: onConfirm },
    ]);

  const runStatusUpdate = async (order, status) => {
    const { error } = await updateOrderStatus(order.id, status);
    if (error) {
      Alert.alert(t('orders.couldNotUpdate'), error.message || t('common.unknownError'));
      return;
    }
    // When marking order as completed, also update the associated post status to ensure it's removed from job board
    if (status === 'completed') {
      console.log('Completing order, updating post:', order.post_id, 'to status: completed');
      const { error: postError } = await updatePost(order.post_id, { status: 'completed' });
      if (postError) {
        console.error('Failed to update post status:', postError);
      } else {
        console.log('Post status updated successfully to completed');
      }
    }
    load();
  };

  const handleAccept = (order) =>
    confirmAction(t('orders.acceptConfirm'),  () => runStatusUpdate(order, 'accepted'));

  const handleDecline = (order) =>
    confirmAction(t('orders.declineConfirm'), () => runStatusUpdate(order, 'declined'));

  const handleComplete = (order) =>
    confirmAction(t('orders.completeConfirm'), () => runStatusUpdate(order, 'completed'));

  const handleReview = (order) =>
    navigation.navigate('LeaveReview', { order });

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { id: 'active',    label: t('orders.tabActive') },
          { id: 'completed', label: t('orders.tabHistory') },
        ].map((tabItem) => (
          <View key={tabItem.id} style={[styles.tab, tab === tabItem.id && styles.tabActive]}>
            <Text
              onPress={() => setTab(tabItem.id)}
              style={[styles.tabText, tab === tabItem.id && styles.tabTextActive]}
            >
              {tabItem.label}
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
            title={tab === 'active' ? t('orders.noActiveTitle') : t('orders.noHistoryTitle')}
            subtitle={tab === 'active'
              ? isSkilled ? t('orders.activeSubSkilled') : t('orders.activeSubNormal')
              : t('orders.historySub')}
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
