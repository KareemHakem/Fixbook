import { supabase } from '../lib/supabase';

// ── Fetch all open posts ───────────────────────────────────────────────────
export const getPosts = async (filters = {}) => {
  let query = supabase
    .from('posts')
    .select('*, profiles(id, full_name, avatar_url)')
    .order('created_at', { ascending: false });

  if (filters.status)   query = query.eq('status', filters.status);
  if (filters.userId)   query = query.eq('user_id', filters.userId);

  const { data, error } = await query;
  return { data, error };
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
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  const response = await fetch(fileUri);
  const blob     = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from('post-images')
    .upload(fileName, blob, { contentType: `image/${fileExt}` });

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
    .single();
  return { data, error };
};

// ── Delete post ────────────────────────────────────────────────────────────
export const deletePost = async (postId) => {
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  return { error };
};

// ── Admin: get all posts ───────────────────────────────────────────────────
export const getAllPosts = async () => {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false });
  return { data, error };
};
