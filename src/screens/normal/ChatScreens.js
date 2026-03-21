import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { MessageBubble, ChatListItem } from '../../components/chat';
import { LoadingSpinner, EmptyState, Avatar } from '../../components/common';
import {
  getChatList, getMessages, sendMessage,
  subscribeToMessages, markMessagesRead,
} from '../../services/chatService';
import { colors } from '../../theme/colors';
import { spacing, typography, radius } from '../../theme/index';

// ─────────────────────────────────────────────────────────────────────────────
// ChatListScreen
// ─────────────────────────────────────────────────────────────────────────────
export function ChatListScreen({ navigation }) {
  const { user } = useAuth();
  const [chats,     setChats]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await getChatList(user.id);
    if (data) setChats(data);
    setLoading(false);
    setRefreshing(false);
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={chats}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => {
            const isNormal  = item.normal_user_id === user.id;
            const otherUser = isNormal ? item.skilled_user : item.normal_user;
            navigation.navigate('ChatDetail', { chatId: item.id, otherName: otherUser?.full_name });
          }}>
            <ChatListItem chat={item} currentUserId={user.id} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="No conversations yet"
            subtitle="When a homeowner starts a chat with you, it will appear here."
          />
        }
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ChatDetailScreen
// ─────────────────────────────────────────────────────────────────────────────
export function ChatDetailScreen({ route, navigation }) {
  const { chatId, otherName } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [text,     setText]     = useState('');
  const [sending,  setSending]  = useState(false);
  const flatRef = useRef(null);

  // Set header title
  useEffect(() => {
    navigation.setOptions({ title: otherName || 'Chat' });
  }, [otherName, navigation]);

  // Load messages
  useEffect(() => {
    getMessages(chatId).then(({ data }) => {
      if (data) setMessages(data);
      setLoading(false);
      markMessagesRead(chatId, user.id);
    });
  }, [chatId, user.id]);

  // Subscribe to realtime
  useEffect(() => {
    const unsubscribe = subscribeToMessages(chatId, (newMsg) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      markMessagesRead(chatId, user.id);
    });
    return unsubscribe;
  }, [chatId, user.id]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setText('');
    setSending(true);
    await sendMessage(chatId, user.id, content);
    setSending(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} isMe={item.sender_id === user.id} />
          )}
          contentContainerStyle={{ paddingVertical: spacing.md }}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', padding: spacing.xl }}>
              <Text style={{ color: colors.textFaint, fontSize: 13 }}>No messages yet. Say hello!</Text>
            </View>
          }
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.msgInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.textFaint}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim() || sending}
            style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.4 }]}
          >
            <Ionicons name="send" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: colors.bg },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bgCard, gap: spacing.sm },
  msgInput: { flex: 1, backgroundColor: colors.bgInput, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: 10, color: colors.textSecondary, fontSize: 14, maxHeight: 100, borderWidth: 1, borderColor: colors.border },
  sendBtn:  { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
