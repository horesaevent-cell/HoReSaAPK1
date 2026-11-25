import { Conversation } from '../../../types/message';

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    recipientId: 'user-2',
    recipientName: 'Kivu Sound Studio',
    recipientRole: 'Ingénieur Son',
    isOnline: true,
    unreadCount: 1,
    lastMessageText: 'La balance X32 est prête pour ce soir.',
    lastMessageTime: '02:05',
    messages: [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-2',
        senderName: 'Kivu Sound Studio',
        text: 'La balance X32 est prête pour ce soir.',
        createdAt: '02:05',
        isOwn: false,
      },
    ],
  },
  {
    id: 'conv-2',
    recipientId: 'user-3',
    recipientName: 'Lac Kivu Events',
    recipientRole: 'Coordination Événement',
    isOnline: false,
    unreadCount: 0,
    lastMessageText: 'Merci pour la confirmation du programme.',
    lastMessageTime: 'Hier',
    messages: [
      {
        id: 'msg-2',
        conversationId: 'conv-2',
        senderId: 'user-3',
        senderName: 'Lac Kivu Events',
        text: 'Merci pour la confirmation du programme.',
        createdAt: 'Hier',
        isOwn: false,
      },
    ],
  },
];