import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../../components/common/Avatar';
import { Colors } from '../../../constants/colors';
import { ReelItemData } from '../../../types/reels';
import { styles } from '../styles';

export type { ReelItemData };

interface ReelItemProps {
  reel: ReelItemData;
  onToggleLike?: (id: string) => void;
  onToggleMute?: () => void;
  onTogglePause?: () => void;
  onShare?: (reel: ReelItemData) => void;
}

export const ReelItem: React.FC<ReelItemProps> = ({
  reel,
  onToggleLike,
  onToggleMute,
  onTogglePause,
  onShare,
}) => {
  const displayAuthor = reel.authorName ?? 'HoReSa';
  const displayCaption = reel.caption ?? '';

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onTogglePause}
      style={styles.reelContainer}
    >
      <View style={styles.videoSurface} />

      <View style={styles.topOverlay}>
        <View style={styles.brandPill}>
          <Text style={styles.brandText}>HoReSa Reels</Text>
        </View>
        <TouchableOpacity onPress={onToggleMute} style={styles.muteButton}>
          <Ionicons
            name={reel.isMuted ? 'volume-mute' : 'volume-high'}
            size={18}
            color={Colors.white}
          />
        </TouchableOpacity>
      </View>

      {reel.isPaused ? (
        <View style={styles.centerPlayBadge}>
          <Ionicons name="play" size={32} color={Colors.white} />
        </View>
      ) : null}

      <View style={styles.bottomContentRow}>
        <View style={styles.metaColumn}>
          <View style={styles.authorRow}>
            <Avatar uri={reel.authorAvatar} name={displayAuthor} size={38} />
            <View style={styles.authorTextGroup}>
              <View style={styles.authorNameRow}>
                <Text style={styles.authorName}>{displayAuthor}</Text>
              </View>
              {reel.authorRole ? (
                <Text style={styles.authorRole}>{reel.authorRole}</Text>
              ) : null}
            </View>
          </View>

          <Text style={styles.caption}>{displayCaption}</Text>

          {reel.tags && reel.tags.length > 0 ? (
            <View style={styles.tagsRow}>
              {reel.tags.map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.actionsColumn}>
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
            onPress={() => onShare?.(reel)}
            style={styles.actionItem}
          >
            <View style={styles.actionCircle}>
              <Ionicons name="share-social-outline" size={22} color={Colors.white} />
            </View>
            <Text style={styles.actionCount}>Partager</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};