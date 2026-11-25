import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  Share,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewToken,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ReelItem, { ReelItemModel } from './components/ReelItem';
import { Colors } from '../../constants/colors';
import { styles } from './styles';

export type ReelCategoryFilter =
  | 'Pour vous'
  | 'Abonnés'
  | 'Talents'
  | 'Ambitions'
  | 'Expériences';

export interface ReelCommentEntry {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface ExtendedReelModel extends ReelItemModel {
  category: Exclude<ReelCategoryFilter, 'Pour vous'>;
  commentsList: ReelCommentEntry[];
}

const STORAGE_REELS_STATE_KEY = '@horesa_reels_state_v1';

const REEL_FILTERS: ReelCategoryFilter[] = [
  'Pour vous',
  'Abonnés',
  'Talents',
  'Ambitions',
  'Expériences',
];

const INITIAL_REELS: ExtendedReelModel[] = [
  {
    id: 'reel-1',
    category: 'Expériences',
    creatorName: 'Lac Kivu Resort',
    creatorHandle: '@lackivuresort',
    creatorRole: 'Hôtellerie & Séjours',
    title: 'Couché de soleil sur le lac Kivu',
    description:
      'Terrasse panoramique, dîner aux chandelles et accueil chaleureux à Bukavu.',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    posterUrl:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1080&q=80',
    likes: 128,
    comments: 2,
    shares: 19,
    isLiked: false,
    isBookmarked: false,
    isFollowing: true,
    commentsList: [
      {
        id: 'c-101',
        authorName: 'Aline M.',
        text: 'Vue incroyable, parfaite pour un week-end détente !',
        createdAt: 'Il y a 18 min',
      },
      {
        id: 'c-102',
        authorName: 'Patrick K.',
        text: 'Disponibilité confirmée pour samedi prochain ?',
        createdAt: 'Il y a 7 min',
      },
    ],
  },
  {
    id: 'reel-2',
    category: 'Talents',
    creatorName: 'Table des Saveurs',
    creatorHandle: '@tabledessaveurs',
    creatorRole: 'Restauration & Traiteur',
    title: 'Préparation du buffet événementiel',
    description:
      'Dressage sur mesure et saveurs locales pour mariages, conférences et galas.',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    posterUrl:
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1080&q=80',
    likes: 94,
    comments: 1,
    shares: 11,
    isLiked: false,
    isBookmarked: false,
    isFollowing: false,
    commentsList: [
      {
        id: 'c-201',
        authorName: 'Sarah N.',
        text: 'Le dressage est super soigné, bravo à l’équipe.',
        createdAt: 'Il y a 42 min',
      },
    ],
  },
  {
    id: 'reel-3',
    category: 'Ambitions',
    creatorName: 'Kivu Scène & Son',
    creatorHandle: '@kivusceneson',
    creatorRole: 'Événementiel & Live',
    title: 'Installation lumière & scène live',
    description:
      'Régie audio, éclairage scénique et coordination technique pour grands événements.',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    posterUrl:
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1080&q=80',
    likes: 76,
    comments: 1,
    shares: 8,
    isLiked: false,
    isBookmarked: false,
    isFollowing: false,
    commentsList: [
      {
        id: 'c-301',
        authorName: 'David B.',
        text: 'Très propre pour notre festival du mois prochain.',
        createdAt: 'Hier',
      },
    ],
  },
];

function getAsyncStorage(): {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
} | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@react-native-async-storage/async-storage');
    const storage = mod?.default ?? mod;
    if (storage?.getItem && storage?.setItem) {
      return {
        getItem: (k: string) => storage.getItem(k),
        setItem: (k: string, v: string) => storage.setItem(k, v),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export const ReelsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { height: windowHeight } = useWindowDimensions();
  const topPadding =
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 10 : 10;

  const [reels, setReels] = useState<ExtendedReelModel[]>(INITIAL_REELS);
  const [selectedFilter, setSelectedFilter] =
    useState<ReelCategoryFilter>('Pour vous');
  const [activeReelId, setActiveReelId] = useState<string>(INITIAL_REELS[0].id);
  const [muted, setMuted] = useState<boolean>(true);
  const [hydrated, setHydrated] = useState<boolean>(false);

  const [activeCommentsReelId, setActiveCommentsReelId] = useState<
    string | null
  >(null);
  const [commentInput, setCommentInput] = useState<string>('');
  const [profileModalVisible, setProfileModalVisible] =
    useState<boolean>(false);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 65,
  }).current;

  // Chargement local persistant
  useEffect(() => {
    let active = true;
    const loadSavedReels = async () => {
      const storage = getAsyncStorage();
      if (!storage) {
        if (active) setHydrated(true);
        return;
      }
      try {
        const raw = await storage.getItem(STORAGE_REELS_STATE_KEY);
        if (!active || !raw) {
          if (active) setHydrated(true);
          return;
        }
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setReels(parsed);
          setActiveReelId(String(parsed[0].id));
        }
      } catch {
        // Garde les Reels initiaux en cas d'erreur de lecture
      } finally {
        if (active) setHydrated(true);
      }
    };
    loadSavedReels();
    return () => {
      active = false;
    };
  }, []);

  // Sauvegarde automatique dans AsyncStorage
  useEffect(() => {
    if (!hydrated) return;
    const storage = getAsyncStorage();
    if (!storage) return;
    storage
      .setItem(STORAGE_REELS_STATE_KEY, JSON.stringify(reels))
      .catch(() => undefined);
  }, [hydrated, reels]);

  const displayedReels = useMemo(() => {
    if (selectedFilter === 'Pour vous') return reels;
    if (selectedFilter === 'Abonnés') {
      const followed = reels.filter((r) => r.isFollowing);
      return followed.length > 0 ? followed : reels;
    }
    const filtered = reels.filter((r) => r.category === selectedFilter);
    return filtered.length > 0 ? filtered : reels;
  }, [reels, selectedFilter]);

  useEffect(() => {
    if (displayedReels.length > 0) {
      const stillPresent = displayedReels.some((r) => r.id === activeReelId);
      if (!stillPresent) {
        setActiveReelId(displayedReels[0].id);
      }
    }
  }, [displayedReels, activeReelId]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const firstVisible = viewableItems.find((v) => v.isViewable && v.item);
      if (firstVisible?.item) {
        setActiveReelId(String((firstVisible.item as ExtendedReelModel).id));
      }
    },
    []
  );

  const handleToggleLike = useCallback((id: string) => {
    setReels((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const nextLiked = !r.isLiked;
        const currentLikes = r.likes ?? 0;
        return {
          ...r,
          isLiked: nextLiked,
          likes: nextLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1),
        };
      })
    );
  }, []);

  const handleToggleBookmark = useCallback((id: string) => {
    setReels((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, isBookmarked: !r.isBookmarked } : r
      )
    );
  }, []);

  const handleToggleFollow = useCallback((id: string) => {
    setReels((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, isFollowing: !r.isFollowing } : r
      )
    );
  }, []);

  const handleShareReel = useCallback(async (id: string) => {
    const target = reels.find((r) => r.id === id);
    if (!target) return;

    setReels((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, shares: (r.shares ?? 0) + 1 } : r
      )
    );

    try {
      await Share.share({
        message: `${target.title ?? 'Reel HoReSa'} par ${
          target.creatorName ?? 'Créateur HoReSa'
        } — ${target.description ?? ''}`,
      });
    } catch {
      Alert.alert(
        'Partage enregistré',
        `Le Reel de ${target.creatorName ?? 'ce créateur'} a été partagé.`
      );
    }
  }, [reels]);

  const handleOpenComments = useCallback((id: string) => {
    setCommentInput('');
    setActiveCommentsReelId(id);
  }, []);

  const activeCommentsReel = useMemo(
    () => reels.find((r) => r.id === activeCommentsReelId) ?? null,
    [reels, activeCommentsReelId]
  );

  const handleSubmitComment = useCallback(() => {
    const clean = commentInput.trim();
    if (!clean || !activeCommentsReelId) return;

    const newComment: ReelCommentEntry = {
      id: `rc-${Date.now()}`,
      authorName: 'Moi',
      text: clean,
      createdAt: 'À l’instant',
    };

    setReels((prev) =>
      prev.map((r) => {
        if (r.id !== activeCommentsReelId) return r;
        const nextList = [...(r.commentsList ?? []), newComment];
        return {
          ...r,
          commentsList: nextList,
          comments: nextList.length,
        };
      })
    );
    setCommentInput('');
  }, [commentInput, activeCommentsReelId]);

  const handleNavigateToCreate = useCallback(() => {
    try {
      navigation.navigate('Create');
    } catch {
      Alert.alert(
        'Publication Reel',
        'Ouvrez l’onglet Publier (+) pour ajouter un nouveau Reel HoReSa.'
      );
    }
  }, [navigation]);

  const savedCount = useMemo(
    () => reels.filter((r) => r.isBookmarked).length,
    [reels]
  );
  const followingCount = useMemo(
    () => reels.filter((r) => r.isFollowing).length,
    [reels]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.black} />

      <FlatList
        data={displayedReels}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <ReelItem
            item={item}
            isActive={item.id === activeReelId}
            muted={muted}
            onToggleMute={() => setMuted((prev) => !prev)}
            onToggleLike={handleToggleLike}
            onToggleBookmark={handleToggleBookmark}
            onToggleFollow={handleToggleFollow}
            onOpenComments={handleOpenComments}
            onShare={handleShareReel}
          />
        )}
      />

      {/* Barre supérieure des filtres, bouton Publier et accès Profil */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: topPadding + 48,
          left: 12,
          right: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={REEL_FILTERS}
          keyExtractor={(f) => f}
          contentContainerStyle={{ gap: 6, paddingRight: 6 }}
          renderItem={({ item: filter }) => {
            const active = selectedFilter === filter;
            return (
              <TouchableOpacity
                onPress={() => setSelectedFilter(filter)}
                activeOpacity={0.85}
                style={{
                  paddingHorizontal: 11,
                  paddingVertical: 5,
                  borderRadius: 16,
                  backgroundColor: active
                    ? Colors.primary
                    : 'rgba(15, 23, 42, 0.68)',
                  borderWidth: 1,
                  borderColor: active
                    ? Colors.primaryLight
                    : 'rgba(255,255,255,0.18)',
                }}
              >
                <Text
                  style={{
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: active ? '700' : '500',
                  }}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity
            onPress={handleNavigateToCreate}
            activeOpacity={0.85}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor: Colors.secondary,
            }}
          >
            <Ionicons name="add" size={16} color={Colors.white} />
            <Text
              style={{
                color: Colors.white,
                fontSize: 12,
                fontWeight: '700',
              }}
            >
              Publier
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setProfileModalVisible(true)}
            activeOpacity={0.85}
            accessibilityLabel="Profil Reels"
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: 'rgba(15, 23, 42, 0.72)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.22)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="person-outline" size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modale Commentaires */}
      <Modal
        visible={Boolean(activeCommentsReel)}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveCommentsReelId(null)}
      >
        <KeyboardAvoidingView
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'flex-end',
          }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={{
              backgroundColor: Colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: Math.round(windowHeight * 0.68),
              padding: 16,
              gap: 12,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text
                style={{
                  color: Colors.textPrimary,
                  fontSize: 16,
                  fontWeight: '700',
                }}
              >
                Commentaires ({activeCommentsReel?.commentsList?.length ?? 0})
              </Text>
              <TouchableOpacity onPress={() => setActiveCommentsReelId(null)}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={activeCommentsReel?.commentsList ?? []}
              keyExtractor={(c) => c.id}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
              ListEmptyComponent={
                <Text
                  style={{
                    color: Colors.textSecondary,
                    fontSize: 13,
                    paddingVertical: 12,
                  }}
                >
                  Aucun commentaire pour le moment. Soyez le premier à réagir.
                </Text>
              }
              renderItem={({ item: comment }) => (
                <View
                  style={{
                    backgroundColor: Colors.background,
                    borderRadius: 12,
                    padding: 10,
                    gap: 3,
                    borderWidth: 1,
                    borderColor: Colors.border,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text
                      style={{
                        color: Colors.textPrimary,
                        fontSize: 13,
                        fontWeight: '700',
                      }}
                    >
                      {comment.authorName}
                    </Text>
                    <Text style={{ color: Colors.textMuted, fontSize: 11 }}>
                      {comment.createdAt}
                    </Text>
                  </View>
                  <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>
                    {comment.text}
                  </Text>
                </View>
              )}
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TextInput
                value={commentInput}
                onChangeText={setCommentInput}
                placeholder="Ajouter un commentaire..."
                placeholderTextColor={Colors.textMuted}
                style={{
                  flex: 1,
                  backgroundColor: Colors.background,
                  color: Colors.textPrimary,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  fontSize: 13,
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
              />
              <TouchableOpacity
                onPress={handleSubmitComment}
                disabled={!commentInput.trim()}
                style={{
                  backgroundColor: Colors.primary,
                  opacity: commentInput.trim() ? 1 : 0.45,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
              >
                <Text
                  style={{
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: '700',
                  }}
                >
                  Envoyer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modale Profil HoReSa Reels */}
      <Modal
        visible={profileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: Colors.surface,
              borderRadius: 18,
              padding: 18,
              gap: 12,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: Colors.textPrimary,
                  fontSize: 16,
                  fontWeight: '800',
                }}
              >
                Mon activité Reels • HoReSa
              </Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>
              Abonnements actifs : {followingCount} • Reels enregistrés :{' '}
              {savedCount}
            </Text>

            <TouchableOpacity
              onPress={() => {
                setProfileModalVisible(false);
                handleNavigateToCreate();
              }}
              style={{
                backgroundColor: Colors.primary,
                borderRadius: 12,
                paddingVertical: 11,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: '700',
                }}
              >
                Créer un nouveau Reel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ReelsScreen;