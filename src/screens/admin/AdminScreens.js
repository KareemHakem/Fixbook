import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, ScrollView,
  TouchableOpacity, Alert, RefreshControl, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../context/LanguageContext';
import {
  Button, Card, Badge, Avatar, LoadingSpinner,
  EmptyState, SectionHeader, Divider,
} from '../../components/common';
import { getAllUsers, deleteUser }                                          from '../../services/profileService';
import { getAllPosts,  deletePost, adminUpdatePostStatus }                  from '../../services/postService';
import { getAllOrders, deleteOrder, updateOrderStatus, getAdminOrderDetail } from '../../services/orderService';
import { getAllReviews, deleteReview }                                      from '../../services/reviewService';
import { getDashboardStats, getRecentActivity }                            from '../../services/adminService';
import { colors } from '../../theme/colors';
import { spacing, typography, radius } from '../../theme/index';

function timeAgo(dateStr, t) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('common.justNow');
  if (mins < 60) return t('common.minutesAgo', { n: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t('common.hoursAgo', { n: hrs });
  return t('common.daysAgo', { n: Math.floor(hrs / 24) });
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminDashboardScreen
// ─────────────────────────────────────────────────────────────────────────────
export function AdminDashboardScreen({ navigation }) {
  const { t } = useTranslation();
  const [stats,    setStats]    = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    const [s, a] = await Promise.all([getDashboardStats(), getRecentActivity()]);
    setStats(s);
    setActivity(a);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading || !stats) return <LoadingSpinner />;

  const skilled  = stats.users.filter(u => u.role === 'skilled');
  const normal   = stats.users.filter(u => u.role === 'normal');
  const totalUsers = stats.users.length;

  const openPosts      = stats.posts.filter(p => p.status === 'open').length;
  const progressPosts  = stats.posts.filter(p => p.status === 'in_progress').length;
  const completedPosts = stats.posts.filter(p => p.status === 'completed').length;
  const cancelledPosts = stats.posts.filter(p => p.status === 'cancelled').length;
  const totalPosts     = stats.posts.length;

  const pendingOrders   = stats.orders.filter(o => o.status === 'pending').length;
  const acceptedOrders  = stats.orders.filter(o => o.status === 'accepted').length;
  const completedOrders = stats.orders.filter(o => o.status === 'completed').length;
  const totalOrders     = stats.orders.length;

  const totalReviews = stats.reviews.length;
  const avgRating = totalReviews > 0
    ? (stats.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : '—';

  const navSections = [
    { label: t('admin.manageUsers'),   icon: 'people-outline',    route: 'AdminUsers',   count: totalUsers },
    { label: t('admin.managePosts'),   icon: 'clipboard-outline', route: 'AdminPosts',   count: totalPosts },
    { label: t('admin.manageOrders'),  icon: 'bag-outline',       route: 'AdminOrders',  count: pendingOrders, highlight: pendingOrders > 0 },
    { label: t('admin.manageReviews'), icon: 'star-outline',      route: 'AdminReviews', count: totalReviews },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <Text style={styles.title}>{t('admin.dashboard')}</Text>

        {/* ── Users overview ── */}
        <Card style={{ marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="people-outline" size={22} color={colors.info} />
              <Text style={{ color: colors.info, fontSize: 28, fontWeight: '800', marginLeft: 10 }}>{totalUsers}</Text>
              <Text style={{ color: colors.textMuted, marginLeft: 8, fontSize: 13 }}>{t('admin.statTotalUsers')}</Text>
            </View>
            {stats.newUsers.length > 0 && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>+{stats.newUsers.length} {t('admin.thisWeek')}</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.sm }}>
              <Ionicons name="construct-outline" size={18} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 22, fontWeight: '800', marginTop: 4 }}>{skilled.length}</Text>
              <Text style={{ color: colors.textFaint, fontSize: 10, textAlign: 'center', marginTop: 2 }}>{t('admin.statSkilled')}</Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.border }} />
            <View style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.sm }}>
              <Ionicons name="home-outline" size={18} color={colors.success} />
              <Text style={{ color: colors.success, fontSize: 22, fontWeight: '800', marginTop: 4 }}>{normal.length}</Text>
              <Text style={{ color: colors.textFaint, fontSize: 10, textAlign: 'center', marginTop: 2 }}>{t('admin.statHomeowners')}</Text>
            </View>
          </View>
        </Card>

        {/* ── Posts by status ── */}
        <SectionHeader title={t('admin.postsByStatus')} />
        <Card style={{ marginBottom: spacing.md }}>
          {[
            { label: t('badge.open'),        value: openPosts,      color: colors.success },
            { label: t('badge.in_progress'), value: progressPosts,  color: colors.warning },
            { label: t('badge.completed'),   value: completedPosts, color: colors.info },
            { label: t('badge.cancelled'),   value: cancelledPosts, color: colors.error },
          ].map(row => (
            <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: row.color, marginRight: 8 }} />
              <Text style={{ width: 88, color: colors.textMuted, fontSize: 12 }}>{row.label}</Text>
              <View style={{ flex: 1, height: 6, backgroundColor: colors.bgMid, borderRadius: 3, marginHorizontal: 8, overflow: 'hidden' }}>
                <View style={{
                  width: totalPosts > 0 ? `${Math.round((row.value / totalPosts) * 100)}%` : '0%',
                  height: 6, backgroundColor: row.color, borderRadius: 3,
                }} />
              </View>
              <Text style={{ color: colors.textFaint, fontSize: 12, width: 22, textAlign: 'right' }}>{row.value}</Text>
            </View>
          ))}
        </Card>

        {/* ── Orders + Rating ── */}
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
          <Card style={{ flex: 3, marginBottom: 0 }}>
            <Text style={{ color: colors.textMuted, fontSize: 11, marginBottom: spacing.sm }}>{t('admin.ordersByStatus')}</Text>
            {[
              { label: t('badge.pending'),   value: pendingOrders,   color: colors.warning },
              { label: t('badge.accepted'),  value: acceptedOrders,  color: colors.success },
              { label: t('badge.completed'), value: completedOrders, color: colors.info },
            ].map(row => (
              <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: row.color, marginRight: 7 }} />
                <Text style={{ flex: 1, color: colors.textMuted, fontSize: 12 }}>{row.label}</Text>
                <Text style={{ color: row.color, fontSize: 14, fontWeight: '800' }}>{row.value}</Text>
              </View>
            ))}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: spacing.sm, marginTop: 4, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Text style={{ flex: 1, color: colors.textFaint, fontSize: 11 }}>Total</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '700' }}>{totalOrders}</Text>
            </View>
          </Card>
          <Card style={{ flex: 2, marginBottom: 0, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="star" size={22} color={colors.warning} />
            <Text style={{ color: colors.warning, fontSize: 30, fontWeight: '900', marginTop: 4 }}>{avgRating}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 10, textAlign: 'center', marginTop: 2 }}>{t('admin.avgRating')}</Text>
            <Text style={{ color: colors.textFaint, fontSize: 10, marginTop: 2 }}>{totalReviews} {t('admin.statReviews').toLowerCase()}</Text>
          </Card>
        </View>

        {/* ── Recent Activity ── */}
        {activity.length > 0 && (
          <>
            <SectionHeader title={t('admin.recentActivity')} />
            <Card style={{ marginBottom: spacing.md }}>
              {activity.map((event, i) => {
                const name = event.type === 'order'
                  ? event.data.normal_user?.full_name
                  : event.data.reviewer?.full_name;
                const avatarUri = event.type === 'order'
                  ? event.data.normal_user?.avatar_url
                  : event.data.reviewer?.avatar_url;
                const label = event.type === 'order'
                  ? t('admin.activityOrder', { name: name || '?', title: event.data.posts?.title || '?' })
                  : t('admin.activityReview', { name: name || '?', rating: event.data.rating });
                return (
                  <View key={i} style={[
                    styles.activityRow,
                    i < activity.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}>
                    <Avatar uri={avatarUri} name={name || '?'} size={32} />
                    <Text style={{ flex: 1, color: colors.textSecondary, fontSize: 12, marginLeft: spacing.sm, lineHeight: 17 }}>
                      {label}
                    </Text>
                    <Text style={{ color: colors.textFaint, fontSize: 10, marginLeft: 6 }}>
                      {timeAgo(event.date, t)}
                    </Text>
                  </View>
                );
              })}
            </Card>
          </>
        )}

        <Divider />

        {/* ── Quick nav ── */}
        <SectionHeader title={t('admin.management')} />
        {navSections.map(s => (
          <TouchableOpacity key={s.route} onPress={() => navigation.navigate(s.route)} style={styles.navRow}>
            <View style={styles.navIconWrap}>
              <Ionicons name={s.icon} size={20} color={colors.primary} />
            </View>
            <Text style={styles.navLabel}>{s.label}</Text>
            {s.highlight && (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>{s.count}</Text>
              </View>
            )}
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
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search,     setSearch]     = useState('');

  const load = async () => {
    const { data } = await getAllUsers();
    if (data) setUsers(data);
    setLoading(false);
    setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = roleFilter !== 'all' ? users.filter(u => u.role === roleFilter) : users;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u => u.full_name?.toLowerCase().includes(q) || u.phone?.includes(q));
    }
    return list;
  }, [users, roleFilter, search]);

  const handleDelete = (userId, name) => {
    Alert.alert(t('admin.deleteUser'), t('admin.deleteUserConfirm', { name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => { await deleteUser(userId); load(); } },
    ]);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm }}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={colors.textFaint} style={{ marginRight: 8 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('admin.searchUsers')}
            placeholderTextColor={colors.textFaint}
            style={{ flex: 1, color: colors.textPrimary, fontSize: 14 }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textFaint} />
            </TouchableOpacity>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.sm }}>
          {[
            { key: 'all',     label: `${t('admin.filterAll')} (${users.length})` },
            { key: 'normal',  label: `${t('admin.filterNormal')} (${users.filter(u => u.role === 'normal').length})` },
            { key: 'skilled', label: `${t('admin.filterSkilled')} (${users.filter(u => u.role === 'skilled').length})` },
          ].map(f => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setRoleFilter(f.key)}
              style={[styles.filterPill, roleFilter === f.key && styles.filterPillActive]}
            >
              <Text style={[styles.filterPillText, roleFilter === f.key && styles.filterPillTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: spacing.md, paddingTop: spacing.sm }}
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
              <View style={{ marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Ionicons name="star" size={12} color={colors.warning} />
                  <Text style={{ color: colors.warning, fontSize: 12, fontWeight: '700' }}>
                    {item.skilled_profiles.rating?.toFixed(1) || '0.0'}
                  </Text>
                  <Text style={{ color: colors.textFaint, fontSize: 12 }}>
                    ({item.skilled_profiles.review_count || 0})
                  </Text>
                </View>
                {item.skilled_profiles.skills?.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                    {item.skilled_profiles.skills.map(skill => (
                      <View key={skill} style={styles.skillPill}>
                        <Text style={styles.skillPillText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                )}
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
export function AdminPostsScreen({ navigation }) {
  const { t } = useTranslation();
  const [posts,        setPosts]       = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [refreshing,   setRefreshing]  = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const load = async () => {
    const { data } = await getAllPosts();
    if (data) setPosts(data);
    setLoading(false);
    setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return posts;
    return posts.filter(p => p.status === statusFilter);
  }, [posts, statusFilter]);

  const handleDelete = (postId, title) => {
    Alert.alert(t('admin.deletePost'), t('admin.deletePostConfirm', { title }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => { await deletePost(postId); load(); } },
    ]);
  };

  const handleStatusChange = (post) => {
    const options = ['open', 'in_progress', 'completed', 'cancelled']
      .filter(s => s !== post.status)
      .map(s => ({
        text: t(`badge.${s}`),
        onPress: async () => { await adminUpdatePostStatus(post.id, s); load(); },
      }));
    Alert.alert(t('admin.changeStatus'), post.title, [
      ...options,
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  if (loading) return <LoadingSpinner />;

  const STATUS_FILTERS = ['all', 'open', 'in_progress', 'completed', 'cancelled'];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ paddingLeft: spacing.md, paddingVertical: spacing.sm }}
        contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.md }}
      >
        {STATUS_FILTERS.map(s => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatusFilter(s)}
            style={[styles.filterPill, statusFilter === s && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, statusFilter === s && styles.filterPillTextActive]}>
              {s === 'all'
                ? `${t('admin.filterAll')} (${posts.length})`
                : `${t(`badge.${s}`)} (${posts.filter(p => p.status === s).length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: spacing.md, paddingTop: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <Card onPress={() => navigation.navigate('PostDetail', { postId: item.id })} style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Text style={{ fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>{item.title}</Text>
                <Text style={{ color: colors.textFaint, fontSize: 12, marginTop: 2 }}>
                  {t('admin.byUserOffers', { name: item.profiles?.full_name, count: item.offers_count })}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Badge status={item.status} />
                <TouchableOpacity onPress={() => handleStatusChange(item)} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <Ionicons name="ellipsis-vertical" size={18} color={colors.textFaint} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.title)} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
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
export function AdminOrdersScreen({ navigation }) {
  const { t } = useTranslation();
  const [orders,       setOrders]      = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [refreshing,   setRefreshing]  = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const load = async () => {
    const { data } = await getAllOrders();
    if (data) setOrders(data);
    setLoading(false);
    setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter(o => o.status === statusFilter);
  }, [orders, statusFilter]);

  const handleDelete = (orderId) => {
    Alert.alert(t('admin.deleteOrder'), t('admin.deleteOrderConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => { await deleteOrder(orderId); load(); } },
    ]);
  };

  const handleStatusChange = (order) => {
    const nextMap = {
      pending:  ['accepted', 'declined', 'cancelled'],
      accepted: ['completed', 'cancelled'],
    };
    const options = (nextMap[order.status] || []).map(s => ({
      text: t(`badge.${s}`),
      onPress: async () => { await updateOrderStatus(order.id, s); load(); },
    }));
    if (!options.length) return;
    Alert.alert(t('admin.changeStatus'), order.posts?.title || '', [
      ...options,
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  if (loading) return <LoadingSpinner />;

  const ORDER_STATUSES = ['all', 'pending', 'accepted', 'completed', 'declined', 'cancelled'];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ paddingLeft: spacing.md, paddingVertical: spacing.sm }}
        contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.md }}
      >
        {ORDER_STATUSES.map(s => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatusFilter(s)}
            style={[styles.filterPill, statusFilter === s && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, statusFilter === s && styles.filterPillTextActive]}>
              {s === 'all'
                ? `${t('admin.filterAll')} (${orders.length})`
                : `${t(`badge.${s}`)} (${orders.filter(o => o.status === s).length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: spacing.md, paddingTop: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <Card onPress={() => navigation.navigate('AdminOrderDetail', { orderId: item.id })} style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Text style={{ fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>{item.posts?.title}</Text>
                <Text style={{ color: colors.textFaint, fontSize: 12, marginTop: 2 }}>
                  {item.normal_user?.full_name} → {item.skilled_user?.full_name}
                </Text>
                <Text style={{ color: colors.textFaint, fontSize: 12 }}>
                  {item.scheduled_date} · {item.scheduled_time?.slice(0, 5)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Badge status={item.status} />
                <TouchableOpacity onPress={() => handleStatusChange(item)} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <Ionicons name="ellipsis-vertical" size={18} color={colors.textFaint} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
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
  const [reviews,    setReviews]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [starFilter, setStarFilter] = useState(0);

  const load = async () => {
    const { data } = await getAllReviews();
    if (data) setReviews(data);
    setLoading(false);
    setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return starFilter === 0 ? reviews : reviews.filter(r => r.rating === starFilter);
  }, [reviews, starFilter]);

  const handleDelete = (reviewId) => {
    Alert.alert(t('admin.deleteReview'), t('admin.deleteReviewConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => { await deleteReview(reviewId); load(); } },
    ]);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ paddingLeft: spacing.md, paddingVertical: spacing.sm }}
        contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.md }}
      >
        <TouchableOpacity
          onPress={() => setStarFilter(0)}
          style={[styles.filterPill, starFilter === 0 && styles.filterPillActive]}
        >
          <Text style={[styles.filterPillText, starFilter === 0 && styles.filterPillTextActive]}>
            {t('admin.filterAll')} ({reviews.length})
          </Text>
        </TouchableOpacity>
        {[5, 4, 3, 2, 1].map(s => (
          <TouchableOpacity
            key={s}
            onPress={() => setStarFilter(starFilter === s ? 0 : s)}
            style={[styles.filterPill, starFilter === s && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, starFilter === s && styles.filterPillTextActive]}>
              {'★'.repeat(s)} ({reviews.filter(r => r.rating === s).length})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: spacing.md, paddingTop: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{item.reviewer?.full_name}</Text>
                <Text style={{ color: colors.textFaint, fontSize: 12 }}>→ {item.skilled_user?.full_name}</Text>
                {item.orders?.posts?.title && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 }}>
                    <Ionicons name="clipboard-outline" size={11} color={colors.textFaint} />
                    <Text style={{ color: colors.textFaint, fontSize: 11 }}>{item.orders.posts.title}</Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', marginTop: 4 }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Ionicons key={s} name={s <= item.rating ? 'star' : 'star-outline'} size={13} color={s <= item.rating ? colors.warning : colors.textFaint} />
                  ))}
                </View>
                {item.review_text && (
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }} numberOfLines={2}>{item.review_text}</Text>
                )}
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

// ─────────────────────────────────────────────────────────────────────────────
// AdminOrderDetailScreen
// ─────────────────────────────────────────────────────────────────────────────
export function AdminOrderDetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { orderId } = route.params;
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await getAdminOrderDetail(orderId);
    if (data) setOrder(data);
    setLoading(false);
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = () => {
    const nextMap = {
      pending:  ['accepted', 'declined', 'cancelled'],
      accepted: ['completed', 'cancelled'],
    };
    const options = (nextMap[order.status] || []).map(s => ({
      text: t(`badge.${s}`),
      onPress: async () => { await updateOrderStatus(order.id, s); load(); },
    }));
    if (!options.length) return;
    Alert.alert(t('admin.changeStatus'), order.posts?.title || '', [
      ...options,
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(t('admin.deleteOrder'), t('admin.deleteOrderConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive', onPress: async () => {
          await deleteOrder(orderId);
          navigation.goBack();
        },
      },
    ]);
  };

  if (loading || !order) return <LoadingSpinner />;

  const canChangeStatus = ['pending', 'accepted'].includes(order.status);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>

        {/* Job */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={styles.sectionLabel}>JOB</Text>
          <Text style={{ fontWeight: '700', color: colors.textPrimary, fontSize: 16, marginBottom: spacing.sm }}>
            {order.posts?.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Badge status={order.status} />
            {order.offers?.price != null && (
              <Text style={{ color: colors.warning, fontWeight: '700', fontSize: 15 }}>€{order.offers.price}</Text>
            )}
          </View>
        </Card>

        {/* People */}
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
          <Card style={{ flex: 1, marginBottom: 0 }}>
            <Text style={styles.sectionLabel}>{t('auth.homeowner').toUpperCase()}</Text>
            <Avatar uri={order.normal_user?.avatar_url} name={order.normal_user?.full_name} size={40} />
            <Text style={{ fontWeight: '600', color: colors.textPrimary, marginTop: 8, fontSize: 13 }}>
              {order.normal_user?.full_name}
            </Text>
            {order.normal_user?.phone && (
              <Text style={{ color: colors.textFaint, fontSize: 12, marginTop: 2 }}>{order.normal_user.phone}</Text>
            )}
          </Card>
          <Card style={{ flex: 1, marginBottom: 0 }}>
            <Text style={styles.sectionLabel}>{t('auth.skilledPro').toUpperCase()}</Text>
            <Avatar uri={order.skilled_user?.avatar_url} name={order.skilled_user?.full_name} size={40} />
            <Text style={{ fontWeight: '600', color: colors.textPrimary, marginTop: 8, fontSize: 13 }}>
              {order.skilled_user?.full_name}
            </Text>
            {order.skilled_user?.skilled_profiles?.rating > 0 && (
              <Text style={{ color: colors.warning, fontSize: 12, marginTop: 2 }}>
                ★ {order.skilled_user.skilled_profiles.rating?.toFixed(1)}
              </Text>
            )}
          </Card>
        </View>

        {/* Schedule */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={styles.sectionLabel}>SCHEDULE</Text>
          {[
            { icon: 'calendar-outline',  label: t('orders.detailDate'),     value: order.scheduled_date },
            { icon: 'time-outline',      label: t('orders.detailTime'),     value: order.scheduled_time?.slice(0, 5) },
            { icon: 'call-outline',      label: t('orders.detailPhone'),    value: order.contact_phone },
            { icon: 'location-outline',  label: t('orders.detailLocation'), value: order.location },
          ].map(row => (
            <View key={row.label} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
              <Ionicons name={row.icon} size={16} color={colors.primary} style={{ marginRight: 10, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textFaint, fontSize: 11 }}>{row.label}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 1 }}>{row.value || '—'}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Actions */}
        {canChangeStatus && (
          <Button
            title={t('admin.changeStatus')}
            onPress={handleStatusChange}
            icon="swap-horizontal-outline"
            style={{ marginBottom: spacing.sm }}
          />
        )}
        <Button
          title={t('common.delete')}
          onPress={handleDelete}
          variant="danger"
          icon="trash-outline"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  title: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.lg },
  sectionLabel: { color: colors.textFaint, fontSize: 10, letterSpacing: 1, marginBottom: 8 },

  // Activity feed
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },

  // Nav rows
  navRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  navIconWrap:  { width: 36, height: 36, borderRadius: radius.md, backgroundColor: '#1F1800', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  navLabel:     { flex: 1, fontWeight: '600', color: colors.textSecondary, fontSize: 15 },
  navBadge:     { backgroundColor: colors.error, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, marginRight: 6 },
  navBadgeText: { color: colors.white, fontSize: 11, fontWeight: '800' },

  // New users badge
  newBadge:     { backgroundColor: colors.success + '28', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  newBadgeText: { color: colors.success, fontSize: 11, fontWeight: '700' },

  // Filter pills
  filterPill:          { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  filterPillActive:    { backgroundColor: colors.primary, borderColor: colors.primary },
  filterPillText:      { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  filterPillTextActive:{ color: colors.white },

  // Search box
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10 },

  // Skill pills
  skillPill:     { backgroundColor: colors.bgMid, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  skillPillText: { color: colors.textMuted, fontSize: 11 },
});
