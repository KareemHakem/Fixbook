import { supabase } from '../lib/supabase';

// ── Get all offers for a post ──────────────────────────────────────────────
export const getOffersForPost = async (postId) => {
  const { data, error } = await supabase
    .from('offers')
    .select(`
      *,
      skilled_user:profiles!offers_skilled_user_id_fkey(
        id,
        full_name,
        avatar_url,
        phone,
        address,
        skilled_profiles(rating, review_count, skills, bio)
      )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: false });
  return { data, error };
};

// ── Get offers by skilled user ─────────────────────────────────────────────
export const getMyOffers = async (skilledUserId) => {
  const { data, error } = await supabase
    .from('offers')
    .select('*, posts(id, title, status, user_id, profiles(full_name))')
    .eq('skilled_user_id', skilledUserId)
    .order('created_at', { ascending: false });
  return { data, error };
};

// ── Check if skilled user already offered on a post ───────────────────────
export const getMyOfferOnPost = async (postId, skilledUserId) => {
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('post_id', postId)
    .eq('skilled_user_id', skilledUserId)
    .maybeSingle();
  return { data, error };
};

// ── Create offer ───────────────────────────────────────────────────────────
export const createOffer = async ({ postId, skilledUserId, description, price }) => {
  const { data, error } = await supabase
    .from('offers')
    .insert({ post_id: postId, skilled_user_id: skilledUserId, description, price })
    .select()
    .single();
  return { data, error };
};

// ── Edit offer ─────────────────────────────────────────────────────────────
export const updateOffer = async (offerId, updates) => {
  const { data, error } = await supabase
    .from('offers')
    .update(updates)
    .eq('id', offerId)
    .select()
    .single();
  return { data, error };
};

// ── Delete offer ───────────────────────────────────────────────────────────
export const deleteOffer = async (offerId) => {
  const { error } = await supabase.from('offers').delete().eq('id', offerId);
  return { error };
};

// ── Admin: get all offers ──────────────────────────────────────────────────
export const getAllOffers = async () => {
  const { data, error } = await supabase
    .from('offers')
    .select('*, posts(title), profiles!offers_skilled_user_id_fkey(full_name)')
    .order('created_at', { ascending: false });
  return { data, error };
};
