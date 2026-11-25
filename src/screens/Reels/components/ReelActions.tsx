import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../../components/common/Avatar';
import { Colors } from '../../../constants/colors';
import { ReelItemData } from '../../../types/reels';
import { styles } from '../styles';

interface ReelActionsProps {
  reel: ReelItemData;
  onToggleLike?: (id: string) => void;
  onOpenComments?: (reel: ReelItemData) => void;
  onToggleSave?: (id: string) => void;
  onShare?: (reel: ReelItemData) => void;
  onOpenAuthorProfile?: (authorId: string) => void;
}

export const ReelActions: React.FC<ReelActionsProps> = ({
  reel,
  onToggleLike,
  onOpenComments,
  onToggleSave,
  onShare,
  onOpenAuthorProfile,
}) => {
  const commentsCount = reel.comments?.length ?? reel.commentsCount ?? 0;
  const authorId = reel.author?.id ?? reel.id;
  const authorName =
    reel.author?.name ?? reel.author?.fullName ?? reel.authorName ?? 'HoReSa';
  const authorAvatar =
    reel.author?.avatarUri ?? reel.author?.avatarUrl ?? reel.authorAvatar;

  return (
    <View style={styles.actionsColumn}>
      <TouchableOpacity
        onPress={() => onOpenAuthorProfile?.(authorId)}
        style={styles.actionItem}
      >
        <Avatar uri={authorAvatar} name={authorName} size={42} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onToggleLike?.(reel.id)}
        style={styles.actionItem}
      >
        <View style={styles.actionCircle}>
          <Ionicons
            name={reel.isLiked ? 'heart' : 'heart-outline'}
            size={22}
            color={reel.isLiked ? Colors.danger : Colors.white}
          />
        </View>
        <Text style={styles.actionCount}>{reel.likesCount ?? 0}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onOpenComments?.(reel)}
        style={styles.actionItem}
      >
        <View style={styles.actionCircle}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={22}
            color={Colors.white}
          />
        </View>
        <Text style={styles.actionCount}>{commentsCount}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onToggleSave?.(reel.id)}
        style={styles.actionItem}
      >
        <View style={styles.actionCircle}>
          <Ionicons
            name={reel.isSaved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={reel.isSaved ? Colors.primary : Colors.white}
          />
        </View>
        <Text style={styles.actionCount}>{reel.isSaved ? 'Sauvé' : 'Favori'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onShare?.(reel)}
        style={styles.actionItem}
      >
        <View style={styles.actionCircle}>
          <Ionicons
            name="share-social-outline"
            size={22}
            color={Colors.white}
          />
        </View>
        <Text style={styles.actionCount}>{reel.sharesCount ?? 'Partager'}</Text>
      </TouchableOpacity>
    </View>
  );
};