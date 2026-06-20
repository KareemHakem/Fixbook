import { supabase } from '../lib/supabase';

export const getDashboardStats = async () => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [users, posts, orders, reviews, newUsers] = await Promise.all([
    supabase.from('profiles').select('id, role').neq('role', 'admin'),
    supabase.from('posts').select('id, status'),
    supabase.from('orders').select('id, status'),
    supabase.from('reviews').select('id, rating'),
    supabase.from('profiles').select('id').neq('role', 'admin').gte('created_at', sevenDaysAgo),
  ]);

  return {
    users:    users.data    || [],
    posts:    posts.data    || [],
    orders:   orders.data   || [],
    reviews:  reviews.data  || [],
    newUsers: newUsers.data || [],
  };
};

export const getRecentActivity = async () => {
  const [orders, reviews] = await Promise.all([
    supabase
      .from('orders')
      .select('id, created_at, normal_user:profiles!orders_normal_user_id_fkey(full_name, avatar_url), posts(title)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('reviews')
      .select('id, created_at, rating, reviewer:profiles!reviews_normal_user_id_fkey(full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const events = [
    ...(orders.data  || []).map(o => ({ type: 'order',  date: o.created_at, data: o })),
    ...(reviews.data || []).map(r => ({ type: 'review', date: r.created_at, data: r })),
  ];
  events.sort((a, b) => new Date(b.date) - new Date(a.date));
  return events.slice(0, 10);
};
