import { supabase } from '../lib/supabase';

// ── Create order ───────────────────────────────────────────────────────────
export const createOrder = async ({
  postId, offerId, normalUserId, skilledUserId,
  scheduledDate, scheduledTime, contactPhone, location,
}) => {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      post_id:         postId,
      offer_id:        offerId,
      normal_user_id:  normalUserId,
      skilled_user_id: skilledUserId,
      scheduled_date:  scheduledDate,
      scheduled_time:  scheduledTime,
      contact_phone:   contactPhone,
      location,
    })
    .select()
    .single();
  return { data, error };
};

// ── Get active order for a post (normal user perspective) ─────────────────
export const getActiveOrderForPost = async (postId, normalUserId) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('post_id', postId)
    .eq('normal_user_id', normalUserId)
    .not('status', 'in', '("declined","cancelled")')
    .maybeSingle();
  return { data, error };
};

// ── Get normal user's orders ───────────────────────────────────────────────
export const getNormalUserOrders = async (normalUserId) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      posts(id, title, image_url),
      offers(price, description),
      skilled_user:profiles!orders_skilled_user_id_fkey(id, full_name, avatar_url, phone)
    `)
    .eq('normal_user_id', normalUserId)
    .order('created_at', { ascending: false });
  return { data, error };
};

// ── Get skilled user's order list ──────────────────────────────────────────
export const getSkilledUserOrders = async (skilledUserId) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      posts(id, title, image_url),
      offers(price, description),
      normal_user:profiles!orders_normal_user_id_fkey(id, full_name, avatar_url, phone, address)
    `)
    .eq('skilled_user_id', skilledUserId)
    .order('scheduled_date', { ascending: true });
  return { data, error };
};

// ── Update order status ────────────────────────────────────────────────────
export const updateOrderStatus = async (orderId, status) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .maybeSingle();

  if (error) return { data: null, error };

  // RLS may permit UPDATE but block the post-update SELECT, returning no row.
  // Treat that as success so the caller can refetch instead of seeing a fake failure.
  if (!data) {
    return { data: { id: orderId, status }, error: null };
  }

  return { data, error: null };
};

// ── Admin: get all orders ──────────────────────────────────────────────────
export const getAllOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      posts(title),
      normal_user:profiles!orders_normal_user_id_fkey(full_name),
      skilled_user:profiles!orders_skilled_user_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false });
  return { data, error };
};

// ── Admin: delete order ────────────────────────────────────────────────────
export const deleteOrder = async (orderId) => {
  const { error } = await supabase.from('orders').delete().eq('id', orderId);
  return { error };
};
