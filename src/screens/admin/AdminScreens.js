import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ScrollView,
  TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import {
  Button, Card, Badge, Avatar, LoadingSpinner,
  EmptyState, SectionHeader, Divider,
} from '../../components/common';
import { getAllUsers, deleteUser }     from '../../services/profileService';
import { getAllPosts,  deletePost }    from '../../services/postService';
import { getAllOffers, deleteOffer }   from '../../services/offerService';
import { getAllOrders, deleteOrder,
         updateOrderStatus }          from '../../services/orderService';
import { getAllReviews, deleteReview } from '../../services/reviewService';
import { colors } from '../../theme/colors';
import { spacing, typography, radius } from '../../theme/index';

// ─────────────────────────────────────────────────────────────────────────────
// AdminDashboardScreen
// ─────────────────────────────────────────────────────────────────────────────
export function AdminDashboardScreen({ navigation }) {
  const { t } = useTranslation();
  const [users,   setUsers]   = useState([]);
  const [posts,   setPosts]   = useState([]);
  const [orders,  setOrders]  = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [u, p, o, r] = await Promise.all([
      getAllUsers(), getAllPosts(), getAllOrders(), getAllReviews(),
    ]);
    if (u.data) setUsers(u.data);
    if (p.data) setPosts(p.data);
    if (o.data) setOrders(o.data);
    if (r.data) setReviews(r.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;

  const skilled  = users.filter((u) => u.role === 'skilled');
  const normal   = users.filter((u) => u.role === 'normal');
  const openJobs = posts.filter((p) => p.status === 'open');
  const active   = orders.filter((o) => ['pending', 'accepted'].includes(o.status));

  const stats = [
    { label: t('admin.statTotalUsers'),   value: users.length,    icon: 'people-outline',    color: colors.info },
    { label: t('admin.statSkilled'),      value: skilled.length,  icon: 'construct-outline', color: colors.primary },
    { label: t('admin.statHomeowners'),   value: normal.length,   icon: 'home-outline',      color: colors.success },
    { label: t('admin.statOpenJobs'),     value: openJobs.length, icon: 'clipboard-outline', color: colors.warning },
    { label: t('admin.statActiveOrders'), value: active.length,   icon: 'bag-outline',       color: '#A855F7' },
    { label: t('admin.statReviews'),      value: reviews.length,  icon: 'star-outline',      color: colors.warning },
  ];

  const sections = [
    { label: t('admin.manageUsers'),   icon: 'people-outline',    route: 'AdminUsers' },
    { label: t('admin.managePosts'),   icon: 'clipboard-outline', route: 'AdminPosts' },
    { label: t('admin.manageOrders'),  icon: 'bag-outline',       route: 'AdminOrders' },
    { label: t('admin.manageReviews'), icon: 'star-outline',      route: 'AdminReviews' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <Text style={styles.title}>{t('admin.dashboard')}</Text>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {stats.map((s) => (
            <View key={s.label} style={[styles.statCard, { borderTopColor: s.color }]}>
              <Ionicons name={s.icon} size={20} color={s.color} />
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Divider />

        {/* Quick nav */}
        <SectionHeader title={t('admin.management')} />
        {sections.map((s) => (
          <TouchableOpacity
            key={s.route}
            onPress={() => navigation.navigate(s.route)}
            style={styles.navRow}
          >
            <View style={styles.navIconWrap}>
              <Ionicons name={s.icon} size={20} color={colors.primary} />
            </View>
            <Text style={styles.navLabel}>{s.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminUsersScreen
// ─────────────────────────────────────────────────────────────────────────────
export function AdminUsersScreen() {
  const { t } = useTranslation();
  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const { data } = await getAllUsers();
    if (data) setUsers(data);
    setLoading(false); setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  const handleDelete = (userId, name) => {
    Alert.alert(t('admin.deleteUser'), t('admin.deleteUserConfirm', { name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => { await deleteUser(userId); load(); } },
    ]);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={users}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Avatar uri={item.avatar_url} name={item.full_name} size={44} />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{item.full_name}</Text>
                <Text style={{ color: colors.textFaint, fontSize: 12 }}>{item.phone || t('admin.noPhone')}</Text>
              </View>
              <Badge status={item.role} />
              <TouchableOpacity onPress={() => handleDelete(item.id, item.full_name)} style={{ marginLeft: spacing.sm }}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
            {item.role === 'skilled' && item.skilled_profiles && (
              <View style={{ marginTop: spacing.sm, flexDirection: 'row', gap: 12 }}>
                <Text style={{ color: colors.warning, fontSize: 12 }}>★ {item.skilled_profiles.rating?.toFixed(1) || '0.0'}</Text>
                <Text style={{ color: colors.textFaint, fontSize: 12 }}>{item.skilled_profiles.skills?.join(', ')}</Text>
              </View>
            )}
          </Card>
        )}
        ListEmptyComponent={<EmptyState icon="people-outline" title={t('admin.noUsers')} />}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminPostsScreen
// ─────────────────────────────────────────────────────────────────────────────
export function AdminPostsScreen() {
  const { t } = useTranslation();
  const [posts,     setPosts]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const { data } = await getAllPosts();
    if (data) setPosts(data);
    setLoading(false); setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  const handleDelete = (postId, title) => {
    Alert.alert(t('admin.deletePost'), t('admin.deletePostConfirm', { title }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => { await deletePost(postId); load(); } },
    ]);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={posts}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Text style={{ fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>{item.title}</Text>
                <Text style={{ color: colors.textFaint, fontSize: 12, marginTop: 2 }}>{t('admin.byUserOffers', { name: item.profiles?.full_name, count: item.offers_count })}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Badge status={item.status} />
                <TouchableOpacity onPress={() => handleDelete(item.id, item.title)}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={<EmptyState icon="clipboard-outline" title={t('admin.noPosts')} />}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminOrdersScreen
// ─────────────────────────────────────────────────────────────────────────────
export function AdminOrdersScreen() {
  const { t } = useTranslation();
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const { data } = await getAllOrders();
    if (data) setOrders(data);
    setLoading(false); setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  const handleDelete = (orderId) => {
    Alert.alert(t('admin.deleteOrder'), t('admin.deleteOrderConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => { await deleteOrder(orderId); load(); } },
    ]);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={orders}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>{item.posts?.title}</Text>
                <Text style={{ color: colors.textFaint, fontSize: 12, marginTop: 2 }}>
                  {item.normal_user?.full_name} → {item.skilled_user?.full_name}
                </Text>
                <Text style={{ color: colors.textFaint, fontSize: 12 }}>{item.scheduled_date} · {item.scheduled_time?.slice(0,5)}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Badge status={item.status} />
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={<EmptyState icon="bag-outline" title={t('admin.noOrders')} />}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminReviewsScreen
// ─────────────────────────────────────────────────────────────────────────────
export function AdminReviewsScreen() {
  const { t } = useTranslation();
  const [reviews,   setReviews]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const { data } = await getAllReviews();
    if (data) setReviews(data);
    setLoading(false); setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  const handleDelete = (reviewId) => {
    Alert.alert(t('admin.deleteReview'), t('admin.deleteReviewConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => { await deleteReview(reviewId); load(); } },
    ]);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={reviews}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{item.reviewer?.full_name}</Text>
                <Text style={{ color: colors.textFaint, fontSize: 12 }}>→ {item.skilled_user?.full_name}</Text>
                <View style={{ flexDirection: 'row', marginTop: 4 }}>
                  {[1,2,3,4,5].map((s) => (
                    <Ionicons key={s} name={s <= item.rating ? 'star' : 'star-outline'} size={13} color={s <= item.rating ? colors.warning : colors.textFaint} />
                  ))}
                </View>
                {item.review_text && <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }} numberOfLines={2}>{item.review_text}</Text>}
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginLeft: spacing.sm }}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          </Card>
        )}
        ListEmptyComponent={<EmptyState icon="star-outline" title={t('admin.noReviews')} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.bg },
  title:       { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.lg },
  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  statCard:    { width: '31%', backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', borderTopWidth: 3, borderWidth: 1, borderColor: colors.border },
  statValue:   { fontSize: 26, fontWeight: '800', marginTop: spacing.sm },
  statLabel:   { color: colors.textFaint, fontSize: 10, marginTop: 3, textAlign: 'center' },
  navRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  navIconWrap: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: '#1F1800', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  navLabel:    { flex: 1, fontWeight: '600', color: colors.textSecondary, fontSize: 15 },
});
