import { supabase } from '../lib/supabase';

// ── Get or create a chat between normal user and skilled user ──────────────
export const getOrCreateChat = async (normalUserId, skilledUserId, postId = null) => {
  // First try to find existing chat
  const { data: existing } = await supabase
    .from('chats')
    .select('*')
    .eq('normal_user_id', normalUserId)
    .eq('skilled_user_id', skilledUserId)
    .maybeSingle();

  if (existing) return { data: existing, error: null };

  // Create new chat
  const { data, error } = await supabase
    .from('chats')
    .insert({ normal_user_id: normalUserId, skilled_user_id: skilledUserId, post_id: postId })
    .select()
    .single();
  return { data, error };
};

// ── Get chat list for any user ─────────────────────────────────────────────
export const getChatList = async (userId) => {
  const { data, error } = await supabase
    .from('chats')
    .select(`
      *,
      normal_user:profiles!chats_normal_user_id_fkey(id, full_name, avatar_url),
      skilled_user:profiles!chats_skilled_user_id_fkey(id, full_name, avatar_url),
      posts(title)
    `)
    .or(`normal_user_id.eq.${userId},skilled_user_id.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false });
  return { data, error };
};

// ── Get messages for a chat ────────────────────────────────────────────────
export const getMessages = async (chatId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
  return { data, error };
};

// ── Send a message ─────────────────────────────────────────────────────────
export const sendMessage = async (chatId, senderId, content) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({ chat_id: chatId, sender_id: senderId, content })
    .select()
    .single();
  return { data, error };
};

// ── Mark messages as read ──────────────────────────────────────────────────
export const markMessagesRead = async (chatId, userId) => {
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('chat_id', chatId)
    .neq('sender_id', userId)
    .eq('is_read', false);
};

// ── Subscribe to new messages (returns unsubscribe fn) ────────────────────
export const subscribeToMessages = (chatId, callback) => {
  const channel = supabase
    .channel(`chat:${chatId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
      (payload) => callback(payload.new),
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
};

// ── Admin: get all chats ───────────────────────────────────────────────────
export const getAllChats = async () => {
  const { data, error } = await supabase
    .from('chats')
    .select(`
      *,
      normal_user:profiles!chats_normal_user_id_fkey(full_name),
      skilled_user:profiles!chats_skilled_user_id_fkey(full_name)
    `)
    .order('last_message_at', { ascending: false });
  return { data, error };
};
