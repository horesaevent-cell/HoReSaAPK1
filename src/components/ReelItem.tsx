import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HoReSaVideoPlayer } from '../../../components/HoReSaVideoPlayer';
import { Colors } from '../../../constants/colors';
import { ReelItemData } from '../../../types/reel';

interface ReelItemProps {
  reel: ReelItemData;
  isActive?: boolean;
  onToggleLike: (id: string) => void;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onShare: (reel: ReelItemData) => void;
}

export const ReelItem: React.FC<ReelItemProps> = ({
  reel,
  isActive = true,
  onToggleLike,
  onToggleMute,
  onShare,
}) => {
  const videoUri = (reel.streamPlaybackUrl ?? reel.videoUrl ?? '').trim();
  const posterUri = (reel.posterUrl ?? reel.thumbnailUrl ?? reel.mediaUrl ?? '').trim();

  const authorName =
    reel.authorName ?? reel.userName ?? 'HoReSa';
  const authorRole = reel.authorRole ?? reel.role ?? '';
  const soundLabel = reel.soundTitle ?? reel.audioTitle ?? 'Son original';
  const likesCount = reel.likesCount ?? reel.likes ?? 0;
  const commentsCount =
    reel.commentsCount ??
    (Array.isArray(reel.comments) ? reel.comments.length : reel.comments ?? 0);
  const sharesCount = reel.sharesCount ?? reel.shares ?? 0;

  return (
    <View style={styles.container}>
      <HoReSaVideoPlayer
        videoUri={videoUri || undefined}
        posterUri={posterUri || undefined}
        isActive={isActive}
        muted={Boolean(reel.isMuted)}
        showMuteButton={false}
      />

      <View pointerEvents="box-none" style={styles.rightActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onToggleLike(reel.id)}
        >
          <Ionicons
            name={reel.isLiked ? 'heart' : 'heart-outline'}
            size={30}
            color={reel.isLiked ? Colors.danger : Colors.white}
          />
          <Text style={styles.actionText}>{likesCount}</Text>
        </TouchableOpacity>

        <View style={styles.actionButton}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={28}
            color={Colors.white}
          />
          <Text style={styles.actionText}>{commentsCount}</Text>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onShare(reel)}
        >
          <Ionicons
            name="share-social-outline"
            size={28}
            color={Colors.white}
          />
          <Text style={styles.actionText}>{sharesCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onToggleMute}>
          <Ionicons
            name={reel.isMuted ? 'volume-mute' : 'volume-high'}
            size={28}
            color={Colors.white}
          />
          <Text style={styles.actionText}>{reel.isMuted ? 'Muet' : 'Son'}</Text>
        </TouchableOpacity>
      </View>

      <View pointerEvents="none" style={styles.bottomOverlay}>
        <Text style={styles.authorName}>{authorName}</Text>
        {authorRole ? <Text style={styles.authorRole}>{authorRole}</Text> : null}
        <Text style={styles.caption} numberOfLines={3}>
          {reel.caption}
        </Text>
        {reel.location || reel.city ? (
          <Text style={styles.metaLine}>
            <Ionicons name="location-outline" size={13} color={Colors.white} />{' '}
            {reel.location || reel.city}
          </Text>
        ) : null}
        <Text style={styles.metaLine} numberOfLines={1}>
          <Ionicons name="musical-notes-outline" size={13} color={Colors.white} />{' '}
          {soundLabel}
        </Text>
        {Boolean(posterUri) && !videoUri ? (
          <Image source={{ uri: posterUri }} style={styles.hiddenPreview} />
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  rightActions: {
    position: 'absolute',
    right: 14,
    bottom: 110,
    alignItems: 'center',
    gap: 18,
    zIndex: 8,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  bottomOverlay: {
    position: 'absolute',
    left: 14,
    right: 76,
    bottom: 24,
    gap: 5,
    zIndex: 8,
  },
  authorName: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  authorRole: {
    color: '#D5E0CC',
    fontSize: 12,
    fontWeight: '500',
  },
  caption: {
    color: Colors.white,
    fontSize: 14,
    lineHeight: 19,
  },
  metaLine: {
    color: '#E5E7EB',
    fontSize: 12,
  },
  hiddenPreview: {
    width: 0,
    height: 0,
    opacity: 0,
  },
});

export default ReelItem;