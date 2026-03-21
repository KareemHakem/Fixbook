import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from '../common';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/index';

// ── Message Bubble ────────────────────────────────────────────────────────────
export function MessageBubble({ message, isMe }) {
  const time = message.created_at
    ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      {!isMe && (
        <Avatar uri={message.sender?.avatar_url} name={message.sender?.full_name} size={28} style={{ marginRight: 6, alignSelf: 'flex-end' }} />
      )}
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        <Text style={[styles.text, isMe && styles.textMe]}>{message.content}</Text>
        <Text style={[styles.time, isMe && styles.timeMe]}>{time}</Text>
      </View>
    </View>
  );
}

// ── Chat List Item ────────────────────────────────────────────────────────────
export function ChatListItem({ chat, currentUserId, onPress }) {
  const isNormal  = chat.normal_user_id === currentUserId;
  const otherUser = isNormal ? chat.skilled_user : chat.normal_user;
  const postTitle = chat.posts?.title;
  const timeStr   = chat.last_message_at
    ? new Date(chat.last_message_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
    : '';

  return (
    <View style={styles.listItem}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Avatar uri={otherUser?.avatar_url} name={otherUser?.full_name} size={46} />
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.listName}>{otherUser?.full_name}</Text>
            {timeStr && <Text style={styles.listTime}>{timeStr}</Text>}
          </View>
          {postTitle && (
            <Text style={styles.listSubtitle} numberOfLines={1}>Re: {postTitle}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Bubbles
  row:        { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 3, paddingHorizontal: spacing.md },
  rowMe:      { justifyContent: 'flex-end' },
  bubble:     { maxWidth: '75%', padding: 10, borderRadius: 16 },
  bubbleMe:   { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: colors.bgCard, borderBottomLeftRadius: 4 },
  text:       { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  textMe:     { color: colors.white },
  time:       { color: colors.textFaint, fontSize: 11, marginTop: 3, textAlign: 'right' },
  timeMe:     { color: 'rgba(255,255,255,0.7)' },
  // List
  listItem:   { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  listName:   { fontWeight: '700', color: colors.textPrimary, fontSize: 15 },
  listSubtitle:{ color: colors.textMuted, fontSize: 12, marginTop: 2 },
  listTime:   { color: colors.textFaint, fontSize: 11 },
});
