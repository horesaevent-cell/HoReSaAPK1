import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../../../types/post';
import styles from '../styles';

interface PostCardProps {
  post: Post;
  onToggleLike: (postId: string) => void;
  onOpenComments: (postId: string) => void;
  onShare: (post: Post) => void;
  onToggleBookmark: (postId: string) => void;
  badgeText?: string;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onToggleLike,
  onOpenComments,
  onShare,
  onToggleBookmark,
  badgeText,
}) => {
  const authorName = post.author?.name ?? post.authorName ?? 'Membre HoReSa';
  const authorHandle = post.author?.handle ?? '@horesa_membre';
  const isVerified = Boolean(post.author?.verified);
  const bodyText = post.content ?? post.text ?? '';
  const imageUri = post.images?.[0] ?? post.imageUrl;
  const likesCount = post.likesCount ?? post.likes ?? 0;
  const commentsCount = post.commentsCount ?? post.comments?.length ?? 0;
  const sharesCount = post.sharesCount ?? post.shares ?? 0;
  const savedCount = post.bookmarksCount ?? 0;

  return (
    <View style={styles.postCard}>
      <View style={styles.postTop}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>
            {authorName.slice(0, 2).toUpperCase()}
          </Text>
        </View>

        <View style={styles.postAuthorCol}>
          <View style={styles.authorNameLine}>
            <Text style={styles.authorName}>{authorName}</Text>
            {isVerified ? (
              <Ionicons name="checkmark-circle" size={15} color="#4ADE80" />
            ) : null}
          </View>
          <Text style={styles.authorSub}>
            {authorHandle} • {post.createdAt}
          </Text>
        </View>

        <View style={styles.networkBadge}>
          <Text style={styles.networkBadgeText}>
            {badgeText ?? (post.fromFollowing ? 'Abonné' : 'Découverte')}
          </Text>
        </View>
      </View>

      {Boolean(post.title) ? (
        <Text style={styles.postTitle}>{post.title}</Text>
      ) : null}

      {Boolean(bodyText) ? (
        <Text style={styles.postText}>{bodyText}</Text>
      ) : null}

      {Boolean(post.location) || Boolean(post.price) || Boolean(post.category) ? (
        <View style={styles.infoTagsRow}>
          {Boolean(post.category) ? (
            <Text style={styles.infoTag}>{String(post.category)}</Text>
          ) : null}
          {Boolean(post.location) ? (
            <Text style={styles.infoTag}>{post.location}</Text>
          ) : null}
          {Boolean(post.price) ? (
            <Text style={styles.infoTag}>{String(post.price)}</Text>
          ) : null}
        </View>
      ) : null}

      {Boolean(imageUri) ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.postImage}
          resizeMode="cover"
        />
      ) : null}

      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onToggleLike(post.id)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={post.isLiked ? 'heart' : 'heart-outline'}
            size={19}
            color={post.isLiked ? '#EF4444' : '#FFFFFF'}
          />
          <Text style={styles.actionText}>{likesCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onOpenComments(post.id)}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#FFFFFF" />
          <Text style={styles.actionText}>{commentsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onShare(post)}
          activeOpacity={0.8}
        >
          <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
          <Text style={styles.actionText}>{sharesCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onToggleBookmark(post.id)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={post.isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color="#FFFFFF"
          />
          <Text style={styles.actionText}>{savedCount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PostCard;