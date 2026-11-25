import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Avatar } from '../../../components/common/Avatar';
import { Conversation } from '../../../types/message';
import { styles } from '../styles';

interface ConversationItemProps {
  conversation: Conversation;
  onPress: (conversation: Conversation) => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => onPress(conversation)}
    >
      <Avatar
        uri={conversation.recipientAvatar}
        name={conversation.recipientName}
        size={48}
      />
      <View style={styles.conversationBody}>
        <View style={styles.conversationTop}>
          <Text style={styles.conversationName} numberOfLines={1}>
            {conversation.recipientName}
          </Text>
          <Text style={styles.conversationTime}>
            {conversation.lastMessageTime}
          </Text>
        </View>
        <Text style={styles.conversationPreview} numberOfLines={1}>
          {conversation.lastMessageText}
        </Text>
      </View>
    </TouchableOpacity>
  );
};