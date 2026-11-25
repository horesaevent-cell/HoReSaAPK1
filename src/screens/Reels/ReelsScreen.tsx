import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Modal,
  Platform,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { useReelsStore } from '../../store/reelsStore';
import HoReSaVideoPlayer from '../../components/HoReSaVideoPlayer';

const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window');

const OVERLAY_DARK =
  (Colors as any).overlayDark ?? 'rgba(0, 0, 0, 0.55)';
const DANGER_COLOR = (Colors as any).danger ?? '#E53935';

interface NormalizedComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

function normalizeComments(rawComments: any): NormalizedComment[] {
  if (!Array.isArray(rawComments)) return [];
  return rawComments.map((c: any, idx: number) => ({
    id: String(c?.id ?? `c-${idx}`),
    author: c?.author || c?.userName || c?.authorName || 'Membre HoReSa',
    text: c?.text || c?.content || '',
    createdAt: c?.createdAt || 'À l’instant',
  }));
}

function getCommentsCount(rawComments: any): number {
  if (Array.isArray(rawComments)) return rawComments.length;
  if (typeof rawComments === 'number') return rawComments;
  return 0;
}

export const ReelsScreen: React.FC = () => {
  const isScreenFocused = useIsFocused();
  const reelsStore = useReelsStore() as any;

  const items: any[] = useMemo(() => {
    return Array.isArray(reelsStore?.reels) ? reelsStore.reels : [];
  }, [reelsStore?.reels]);

  const [containerHeight, setContainerHeight] = useState<number>(WINDOW_HEIGHT);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [commentReelId, setCommentReelId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [profileReelId, setProfileReelId] = useState<string | null>(null);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 70,
  }).current;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  useEffect(() => {
    if (activeIndex >= items.length && items.length > 0) {
      setActiveIndex(0);
    }
  }, [activeIndex, items.length]);

  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const h = Math.round(event.nativeEvent.layout.height);
    if (h > 100 && h !== containerHeight) {
      setContainerHeight(h);
    }
  }, [containerHeight]);

  const selectedCommentReel = useMemo(
    () => items.find((r) => r.id === commentReelId) ?? null,
    [commentReelId, items]
  );

  const selectedProfileReel = useMemo(
    () => items.find((r) => r.id === profileReelId) ?? null,
    [items, profileReelId]
  );

  const handleToggleLike = useCallback(
    (reelId: string) => {
      reelsStore?.toggleLike?.(reelId);
    },
    [reelsStore]
  );

  const handleToggleSave = useCallback(
    (reelId: string) => {
      if (typeof reelsStore?.toggleSave === 'function') {
        reelsStore.toggleSave(reelId);
      } else if (typeof reelsStore?.toggleBookmark === 'function') {
        reelsStore.toggleBookmark(reelId);
      }
    },
    [reelsStore]
  );

  const handleToggleFollow = useCallback(
    (reelId: string) => {
      reelsStore?.toggleFollow?.(reelId);
    },
    [reelsStore]
  );

  const handleSendComment = useCallback(() => {
    if (!commentReelId || !commentText.trim()) return;
    const text = commentText.trim();
    if (typeof reelsStore?.addComment === 'function') {
      reelsStore.addComment(commentReelId, text, 'Visiteur HoReSa');
    }
    setCommentText('');
  }, [commentReelId, commentText, reelsStore]);

  const handleShare = useCallback(
    async (reel: any) => {
      if (typeof reelsStore?.incrementShare === 'function') {
        reelsStore.incrementShare(reel.id);
      } else if (typeof reelsStore?.shareReel === 'function') {
        reelsStore.shareReel(reel.id);
      }

      const authorLabel = reel.authorName || reel.userName || 'Créateur HoReSa';
      try {
        await Share.share({
          message: `${authorLabel} sur HoReSa : ${reel.caption ?? ''}`,
        });
      } catch {
        // Ignorer l'annulation du partage
      }
    },
    [reelsStore]
  );

  const renderReel = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      const isCurrent = index === activeIndex;
      const authorLabel = item.authorName || item.userName || 'Créateur HoReSa';
      const handleLabel = item.handle || item.userHandle || '@horesa';
      const roleLabel =
        item.role || item.authorRole || item.category || 'HoReSa';
      const likesTotal = item.likesCount ?? item.likes ?? 0;
      const commentsTotal = getCommentsCount(item.comments);
      const isBookmarked = Boolean(item.isSaved ?? item.isBookmarked);
      const playbackUri = item.videoUrl?.trim() || undefined;
      const posterUri = item.thumbnailUrl || item.mediaUrl || item.avatarUri;

      return (
        <View style={[styles.reelPage, { height: containerHeight }]}>
          <View style={StyleSheet.absoluteFill}>
            <HoReSaVideoPlayer
              videoUri={playbackUri}
              posterUri={posterUri}
              isActive={
                isScreenFocused &&
                isCurrent &&
                !profileReelId &&
                !commentReelId
              }
              muted={Boolean(item.isMuted)}
              muteButtonTop={
                Platform.OS === 'android'
                  ? (StatusBar.currentHeight ?? 24) + 52
                  : 98
              }
            />
          </View>

          <View style={styles.topBar} pointerEvents="box-none">
            <Text style={styles.topBrand}>HoReSa Reels</Text>
            {Boolean(item.city) && (
              <View style={styles.cityPill}>
                <Ionicons
                  name="location-outline"
                  size={13}
                  color={Colors.textOnPrimary}
                />
                <Text style={styles.cityPillText}>{item.city}</Text>
              </View>
            )}
          </View>

          <View style={styles.rightActions} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleToggleLike(item.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={item.isLiked ? 'heart' : 'heart-outline'}
                size={29}
                color={item.isLiked ? DANGER_COLOR : Colors.textOnPrimary}
              />
              <Text style={styles.actionCount}>{likesTotal}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setCommentReelId(item.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={27}
                color={Colors.textOnPrimary}
              />
              <Text style={styles.actionCount}>{commentsTotal}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleToggleSave(item.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={27}
                color={
                  isBookmarked ? Colors.primaryLight : Colors.textOnPrimary
                }
              />
              <Text style={styles.actionCount}>Sauver</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleShare(item)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="paper-plane-outline"
                size={26}
                color={Colors.textOnPrimary}
              />
              <Text style={styles.actionCount}>{item.shares ?? 0}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomInfo} pointerEvents="box-none">
            <View style={styles.authorRow}>
              <TouchableOpacity
                style={styles.authorTouchable}
                onPress={() => setProfileReelId(item.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.authorName} numberOfLines={1}>
                  {authorLabel}
                </Text>
                <Text style={styles.authorMeta} numberOfLines={1}>
                  {handleLabel} • {roleLabel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.followChip,
                  item.isFollowing && styles.followChipActive,
                ]}
                onPress={() => handleToggleFollow(item.id)}
                activeOpacity={0.85}
              >
                <Text style={styles.followChipText}>
                  {item.isFollowing ? 'Suivi' : 'Suivre'}
                </Text>
              </TouchableOpacity>
            </View>

            {Boolean(item.caption) && (
              <Text style={styles.captionText} numberOfLines={3}>
                {item.caption}
              </Text>
            )}

            {Boolean(item.audioTitle) && (
              <View style={styles.audioRow}>
                <Ionicons
                  name="musical-notes-outline"
                  size={13}
                  color={Colors.primaryLight}
                />
                <Text style={styles.audioText} numberOfLines={1}>
                  {item.audioTitle}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    },
    [
      activeIndex,
      commentReelId,
      containerHeight,
      handleShare,
      handleToggleFollow,
      handleToggleLike,
      handleToggleSave,
      isScreenFocused,
      profileReelId,
    ]
  );

  const commentList = useMemo(() => {
    if (!selectedCommentReel) return [];
    return normalizeComments(selectedCommentReel.comments);
  }, [selectedCommentReel]);

  return (
    <View style={styles.container} onLayout={handleContainerLayout}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="film-outline"
            size={44}
            color={Colors.textOnPrimary}
          />
          <Text style={styles.emptyTitle}>Aucun Reel disponible</Text>
          <Text style={styles.emptySubtitle}>
            Publiez une photo ou une vidéo depuis l’onglet Publier.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => String(item?.id ?? index)}
          renderItem={renderReel}
          pagingEnabled
          snapToInterval={containerHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: containerHeight,
            offset: containerHeight * index,
            index,
          })}
          extraData={`${activeIndex}-${containerHeight}-${isScreenFocused}`}
        />
      )}

      <Modal
        visible={Boolean(selectedCommentReel)}
        animationType="slide"
        transparent
        onRequestClose={() => setCommentReelId(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Commentaires ({commentList.length})
              </Text>
              <TouchableOpacity onPress={() => setCommentReelId(null)}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={commentList}
              keyExtractor={(c) => c.id}
              style={styles.commentsScroll}
              ListEmptyComponent={
                <Text style={styles.emptyComments}>
                  Aucun commentaire pour le moment. Soyez le premier à réagir.
                </Text>
              }
              renderItem={({ item: c }) => (
                <View style={styles.commentItem}>
                  <Text style={styles.commentAuthor}>{c.author}</Text>
                  <Text style={styles.commentBody}>{c.text}</Text>
                  <Text style={styles.commentDate}>{c.createdAt}</Text>
                </View>
              )}
            />

            <View style={styles.commentInputRow}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Écrire un commentaire..."
                placeholderTextColor={Colors.textSecondary}
                style={styles.commentInput}
              />
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={handleSendComment}
              >
                <Ionicons name="send" size={18} color={Colors.textOnPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={Boolean(selectedProfileReel)}
        animationType="fade"
        transparent
        onRequestClose={() => setProfileReelId(null)}
      >
        <View style={styles.modalBackdropCenter}>
          <View style={styles.profileModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profil Créateur HoReSa</Text>
              <TouchableOpacity onPress={() => setProfileReelId(null)}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedProfileReel && (
              <View style={styles.profileBody}>
                <Text style={styles.profileModalName}>
                  {selectedProfileReel.authorName ||
                    selectedProfileReel.userName ||
                    'Créateur HoReSa'}
                </Text>
                <Text style={styles.profileModalHandle}>
                  {selectedProfileReel.handle ||
                    selectedProfileReel.userHandle ||
                    '@horesa'}{' '}
                  •{' '}
                  {selectedProfileReel.role ||
                    selectedProfileReel.category ||
                    'HoReSa'}
                </Text>
                {Boolean(selectedProfileReel.city) && (
                  <Text style={styles.profileModalCity}>
                    Ville : {selectedProfileReel.city}
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.closeModalBtn}
                  onPress={() => setProfileReelId(null)}
                >
                  <Text style={styles.closeModalBtnText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ReelsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    gap: 8,
  },
  emptyTitle: {
    color: Colors.textOnPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: Colors.primaryLight,
    fontSize: 13,
    textAlign: 'center',
  },
  reelPage: {
    width: WINDOW_WIDTH,
    backgroundColor: Colors.primaryDark,
    overflow: 'hidden',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop:
      Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 10 : 50,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 8,
  },
  topBrand: {
    color: Colors.textOnPrimary,
    fontSize: 17,
    fontWeight: '800',
    textShadowColor: OVERLAY_DARK,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: OVERLAY_DARK,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  cityPillText: {
    color: Colors.textOnPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  rightActions: {
    position: 'absolute',
    right: 12,
    bottom: 28,
    alignItems: 'center',
    gap: 16,
    zIndex: 8,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 3,
  },
  actionCount: {
    color: Colors.textOnPrimary,
    fontSize: 12,
    fontWeight: '700',
    textShadowColor: OVERLAY_DARK,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomInfo: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 14,
    paddingRight: 76,
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    zIndex: 6,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  authorTouchable: {
    flex: 1,
  },
  authorName: {
    color: Colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  authorMeta: {
    color: Colors.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  followChip: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  followChipActive: {
    backgroundColor: Colors.primaryDark,
  },
  followChipText: {
    color: Colors.textOnPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  captionText: {
    color: Colors.textOnPrimary,
    fontSize: 14,
    lineHeight: 19,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  audioText: {
    color: Colors.primaryLight,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: OVERLAY_DARK,
    justifyContent: 'flex-end',
  },
  modalBackdropCenter: {
    flex: 1,
    backgroundColor: OVERLAY_DARK,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '72%',
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  commentsScroll: {
    maxHeight: 280,
  },
  emptyComments: {
    color: Colors.textSecondary,
    fontSize: 13,
    paddingVertical: 20,
    textAlign: 'center',
  },
  commentItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 2,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  commentBody: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  commentDate: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileModalCard: {
    backgroundColor: Colors.card,
    margin: 20,
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  profileBody: {
    gap: 8,
  },
  profileModalName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  profileModalHandle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  profileModalCity: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  closeModalBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeModalBtnText: {
    color: Colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
});