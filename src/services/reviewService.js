import { supabase } from '../lib/supabase';

// ── Create review ──────────────────────────────────────────────────────────
export const createReview = async ({ orderId, normalUserId, skilledUserId, rating, reviewText }) => {
  const { data, error } = await supabase
    .from('reviews')
    .insert({ order_id: orderId, normal_user_id: normalUserId, skilled_user_id: skilledUserId, rating, review_text: reviewText || null })
    .select()
    .single();
  return { data, error };
};

// ── Get reviews for a skilled user ────────────────────────────────────────
export const getReviewsForSkilledUser = async (skilledUserId) => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, reviewer:profiles!reviews_normal_user_id_fkey(id, full_name, avatar_url)')
    .eq('skilled_user_id', skilledUserId)
    .order('created_at', { ascending: false });
  return { data, error };
};

// ── Check if review already exists for order ──────────────────────────────
export const getReviewForOrder = async (orderId) => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();
  return { data, error };
};

// ── Admin: get all reviews ─────────────────────────────────────────────────
export const getAllReviews = async () => {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviews_normal_user_id_fkey(full_name),
      skilled_user:profiles!reviews_skilled_user_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false });
  return { data, error };
};

// ── Admin: delete review ───────────────────────────────────────────────────
export const deleteReview = async (reviewId) => {
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
  return { error };
};
