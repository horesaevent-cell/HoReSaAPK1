export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  isOwn: boolean;
}

export interface Conversation {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientRole: string;
  recipientAvatar?: string;
  isOnline: boolean;
  unreadCount: number;
  lastMessageText: string;
  lastMessageTime: string;
  messages: ChatMessage[];
}

export type MessageItem = ChatMessage;
export type ConversationItemType = Conversation;