import { supabase } from '../lib/supabase';

// ── Get any profile by ID ─────────────────────────────────────────────────
export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, skilled_profiles(*)')
    .eq('id', userId)
    .single();
  return { data, error };
};

// ── Update profile ─────────────────────────────────────────────────────────
export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
};

// ── Update skilled profile ─────────────────────────────────────────────────
export const updateSkilledProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('skilled_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
};

// ── Upload avatar ──────────────────────────────────────────────────────────
export const uploadAvatar = async (userId, fileUri, fileExt = 'jpg') => {
  const fileName  = `${userId}/avatar.${fileExt}`;
  const response  = await fetch(fileUri);
  const blob      = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, blob, { upsert: true, contentType: `image/${fileExt}` });

  if (uploadError) return { error: uploadError };

  const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
  return { url: data.publicUrl };
};

// ── Get skilled users directory ────────────────────────────────────────────
export const getSkilledUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, skilled_profiles(*)')
    .eq('role', 'skilled')
    .order('created_at', { ascending: false });
  return { data, error };
};

// ── Admin: get all users ───────────────────────────────────────────────────
export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, skilled_profiles(*)')
    .neq('role', 'admin')
    .order('created_at', { ascending: false });
  return { data, error };
};

// ── Admin: delete user ─────────────────────────────────────────────────────
export const deleteUser = async (userId) => {
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  return { error };
};
