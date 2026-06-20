import { supabase } from '../lib/supabase';

// ── Fetch all open posts ───────────────────────────────────────────────────
export const getPosts = async (filters = {}) => {
  let query = supabase
    .from('posts')
    .select('*, profiles(id, full_name, avatar_url), offers(count), orders(id, status)')
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  } else {
    // Job board should not show completed or cancelled posts
    query = query.in('status', ['open', 'in_progress']);
  }

  if (filters.userId) query = query.eq('user_id', filters.userId);

  const { data, error } = await query;
  if (error) return { data, error };

  const normalized = (data ?? [])
    .map((p) => ({
      ...p,
      offers_count: p.offers?.[0]?.count ?? p.offers_count ?? 0,
      has_completed_order: p.orders?.some((o) => o.status === 'completed'),
    }))
    .filter((p) => !p.has_completed_order);

  console.log('getPosts returned posts with statuses:', normalized.map((p) => ({ id: p.id, title: p.title, status: p.status, has_completed_order: p.has_completed_order })));

  return { data: normalized, error };
};

// ── Fetch single post ──────────────────────────────────────────────────────
export const getPost = async (postId) => {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(id, full_name, avatar_url, phone)')
    .eq('id', postId)
    .single();
  return { data, error };
};

// ── Create post ────────────────────────────────────────────────────────────
export const createPost = async ({ userId, title, description, imageUrl }) => {
  const { data, error } = await supabase
    .from('posts')
    .insert({ user_id: userId, title, description, image_url: imageUrl || null })
    .select()
    .single();
  return { data, error };
};

// ── Upload post image ──────────────────────────────────────────────────────
export const uploadPostImage = async (userId, fileUri, fileExt = 'jpg') => {
  const fileName    = `${userId}/${Date.now()}.${fileExt}`;
  const response    = await fetch(fileUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('post-images')
    .upload(fileName, arrayBuffer, { contentType: `image/${fileExt}` });

  if (uploadError) return { error: uploadError };

  const { data } = supabase.storage.from('post-images').getPublicUrl(fileName);
  return { url: data.publicUrl };
};

// ── Edit post ──────────────────────────────────────────────────────────────
export const updatePost = async (postId, updates) => {
  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', postId)
    .select()
    .maybeSingle();

  // If RLS allows the update but not the returned row, treat it as success.
  if (!data && !error) {
    return { data: { id: postId, ...updates }, error: null };
  }

  return { data, error };
};

// ── Delete post ────────────────────────────────────────────────────────────
export const deletePost = async (postId) => {
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  return { error };
};

// ── Admin: update post status ──────────────────────────────────────────────
export const adminUpdatePostStatus = async (postId, status) => {
  const { data, error } = await supabase
    .from('posts')
    .update({ status })
    .eq('id', postId)
    .select()
    .single();
  return { data, error };
};

// ── Admin: get all posts ───────────────────────────────────────────────────
export const getAllPosts = async () => {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false });
  return { data, error };
};
