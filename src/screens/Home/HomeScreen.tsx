import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post, PostCategory, PostComment, StoryItem } from '../../types/post';
import { HOME_INITIAL_POSTS, HOME_STORIES } from './data/homeMockData';
import { StoryList } from './components/StoryList';
import { PostCard } from './components/PostCard';
import styles from './styles';

type FeedMode = 'Tout' | 'Abonnés' | 'Découvrir';
type SpecialtyOption = 'Hôtels' | 'Restaurants' | 'Événements' | 'Offres';
type MediaKind = 'image' | 'video';

const DEFAULT_VIDEO_POSTER =
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80';

const API_BASE_URL =
  typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_HORESA_API_URL
    ? String(process.env.EXPO_PUBLIC_HORESA_API_URL).replace(/\/+$/, '')
    : '';

interface MediaPlayerProps {
  uri: string;
  kind: MediaKind;
  posterUri?: string;
  style?: any;
  autoPlay?: boolean;
  fullScreenVertical?: boolean;
  onAspectRatioDetected?: (ratio: number) => void;
}

const HoReSaMediaView: React.FC<MediaPlayerProps> = ({
  uri,
  kind,
  posterUri,
  style,
  autoPlay = false,
  fullScreenVertical = false,
  onAspectRatioDetected,
}) => {
  const nativeVideoRef = useRef<any>(null);
  const [detectedRatio, setDetectedRatio] = useState<number | null>(null);
  const resolvedPoster = posterUri || DEFAULT_VIDEO_POSTER;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const contentWidth = Math.min(screenWidth, 680);

  useEffect(() => {
    setDetectedRatio(null);
  }, [uri, kind]);

  const reportRatio = useCallback(
    (w?: number, h?: number) => {
      if (!w || !h || w <= 0 || h <= 0) return;
      const ratio = w / h;
      setDetectedRatio(ratio);
      onAspectRatioDetected?.(ratio);
    },
    [onAspectRatioDetected]
  );

  const adaptiveStyle = useMemo(() => {
    if (fullScreenVertical) {
      return {
        width: screenWidth,
        height: screenHeight,
        borderRadius: 0,
      };
    }
    if (detectedRatio) {
      const targetHeight = Math.round(contentWidth / detectedRatio);
      return {
        width: '100%' as const,
        height: Math.max(160, Math.min(screenHeight * 0.72, targetHeight)),
        aspectRatio: detectedRatio,
      };
    }
    return {
      width: '100%' as const,
      height: Math.min(320, Math.round(screenHeight * 0.38)),
    };
  }, [fullScreenVertical, detectedRatio, screenWidth, screenHeight, contentWidth]);

  if (kind !== 'video') {
    return (
      <Image
        source={{ uri }}
        style={[
          { width: '100%', backgroundColor: '#0B1406' },
          style,
          adaptiveStyle,
        ]}
        resizeMode={fullScreenVertical ? 'contain' : 'cover'}
        onLoad={(e) => {
          const nat = e?.nativeEvent?.source;
          if (nat?.width && nat?.height) {
            reportRatio(nat.width, nat.height);
          } else {
            Image.getSize(
              uri,
              (w, h) => reportRatio(w, h),
              () => undefined
            );
          }
        }}
      />
    );
  }

  if (Platform.OS === 'web') {
    const WebVideo = 'video' as any;
    return (
      <View
        style={[
          {
            width: '100%',
            overflow: 'hidden',
            backgroundColor: '#0B1406',
          },
          style,
          adaptiveStyle,
        ]}
      >
        <WebVideo
          src={uri}
          poster={resolvedPoster}
          preload="metadata"
          controls
          playsInline
          autoPlay={autoPlay}
          loop
          muted
          onLoadedMetadata={(e: any) => {
            const vid = e?.currentTarget;
            if (vid?.videoWidth && vid?.videoHeight) {
              reportRatio(vid.videoWidth, vid.videoHeight);
            }
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: fullScreenVertical ? 'contain' : 'cover',
            display: 'block',
          }}
        />
      </View>
    );
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const expoVideo = require('expo-video');
    if (expoVideo?.VideoView && expoVideo?.useVideoPlayer) {
      const VideoViewComp = expoVideo.VideoView;
      const player = expoVideo.useVideoPlayer(uri, (p: any) => {
        p.loop = true;
        if (autoPlay) {
          p.play();
        }
      });

      return (
        <VideoViewComp
          player={player}
          style={[
            { width: '100%', backgroundColor: '#0B1406' },
            style,
            adaptiveStyle,
          ]}
          nativeControls
          contentFit={fullScreenVertical ? 'contain' : 'cover'}
        />
      );
    }
  } catch {
    // Repli sur expo-av si expo-video n'est pas installé
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const expoAv = require('expo-av');
    if (expoAv?.Video) {
      const AvVideo = expoAv.Video;
      const resizeMode = fullScreenVertical
        ? expoAv.ResizeMode?.CONTAIN ?? 'contain'
        : expoAv.ResizeMode?.COVER ?? 'cover';
      return (
        <AvVideo
          ref={nativeVideoRef}
          source={{ uri }}
          posterSource={{ uri: resolvedPoster }}
          usePoster
          onLoad={(status: any) => {
            const natSize = status?.naturalSize;
            if (natSize?.width && natSize?.height) {
              reportRatio(natSize.width, natSize.height);
            }
          }}
          style={[
            { width: '100%', backgroundColor: '#0B1406' },
            style,
            adaptiveStyle,
          ]}
          useNativeControls
          shouldPlay={autoPlay}
          isLooping
          resizeMode={resizeMode}
        />
      );
    }
  } catch {
    // Repli visuel final
  }

  return (
    <View
      style={[
        { width: '100%' },
        style,
        adaptiveStyle,
        {
          backgroundColor: '#166534',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: 12,
        },
      ]}
    >
      <Image
        source={{ uri: resolvedPoster }}
        style={{
          ...({
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            opacity: 0.35,
          } as any),
        }}
        resizeMode="cover"
      />
      <Ionicons name="videocam" size={28} color="#FFFFFF" />
      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800' }}>
        Vidéo sélectionnée
      </Text>
    </View>
  );
};

const STORAGE_KEYS = {
  POSTS: '@horesa_home_posts_v1',
  STORIES: '@horesa_home_stories_v1',
  SUGGESTIONS: '@horesa_home_suggestions_v1',
  FOLLOWED_AUTHORS: '@horesa_followed_authors_v1',
  PREFS: '@horesa_home_prefs_v1',
};

const FEED_MODES: FeedMode[] = ['Tout', 'Abonnés', 'Découvrir'];

const CATEGORIES: Array<'Toutes' | SpecialtyOption | PostCategory> = [
  'Toutes',
  'Hôtels',
  'Restaurants',
  'Événements',
  'Offres',
];

const SPECIALTIES: SpecialtyOption[] = [
  'Hôtels',
  'Restaurants',
  'Événements',
  'Offres',
];

const STORY_PRESET_IMAGES = [
  {
    label: 'Hôtel & Vue',
    uri: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'Table & Saveurs',
    uri: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'Événement & Scène',
    uri: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80',
  },
];

interface SuggestedProfile {
  id: string;
  name: string;
  handle: string;
  role: string;
  city: string;
  avatarUri: string;
  isFollowed: boolean;
}

const INITIAL_SUGGESTIONS: SuggestedProfile[] = [
  {
    id: 'sug-1',
    name: 'Lac Kivu Resort',
    handle: '@lackivuresort',
    role: 'Hôtellerie & Séjours',
    city: 'Bukavu',
    avatarUri:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80',
    isFollowed: false,
  },
  {
    id: 'sug-2',
    name: 'Table des Saveurs',
    handle: '@table_saveurs',
    role: 'Restauration & Traiteur',
    city: 'Bukavu',
    avatarUri:
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=300&q=80',
    isFollowed: false,
  },
  {
    id: 'sug-3',
    name: 'Kivu Scène & Son',
    handle: '@kivuscene',
    role: 'Événementiel & Live',
    city: 'Bukavu',
    avatarUri:
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=300&q=80',
    isFollowed: false,
  },
];

function inferMediaKind(uri?: string, assetType?: string | null): MediaKind {
  if (assetType === 'video') return 'video';
  if (!uri) return 'image';
  const clean = uri.toLowerCase();
  if (
    clean.startsWith('data:video/') ||
    /\.(mp4|mov|m4v|webm|avi|3gp)(\?|$)/.test(clean)
  ) {
    return 'video';
  }
  return 'image';
}

function getPostAuthorKey(post: Post): string {
  return (
    post.author?.id ||
    post.author?.handle ||
    post.author?.name ||
    post.authorName ||
    post.id
  );
}

function buildShareUrl(postId: string): string {
  const encodedId = encodeURIComponent(postId);
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const base = `${window.location.origin}${window.location.pathname || '/'}`;
    return `${base}?post=${encodedId}`;
  }
  return `https://horesa.app/?post=${encodedId}`;
}

function getSharedPostIdFromWebUrl(): string | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.location) {
    return null;
  }
  try {
    const params = new URLSearchParams(window.location.search || '');
    const postParam = params.get('post');
    return postParam && postParam.trim().length > 0 ? postParam.trim() : null;
  } catch {
    return null;
  }
}

async function syncInteractionToBackend(
  endpoint: string,
  payload: Record<string, any>
): Promise<void> {
  if (!API_BASE_URL || typeof fetch !== 'function') return;
  try {
    await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Persistance locale déjà garantie dans AsyncStorage
  }
}

function getAsyncStorage(): {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  multiRemove: (keys: string[]) => Promise<void>;
} | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@react-native-async-storage/async-storage');
    const storage = mod?.default ?? mod;
    if (storage?.getItem && storage?.setItem) {
      return {
        getItem: (k: string) => storage.getItem(k),
        setItem: (k: string, v: string) => storage.setItem(k, v),
        multiRemove: (ks: string[]) =>
          storage.multiRemove
            ? storage.multiRemove(ks)
            : Promise.all(ks.map((k) => storage.removeItem?.(k))).then(
                () => undefined
              ),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export const HomeScreen: React.FC = () => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isCompactPhone = windowWidth < 375;

  const [userName, setUserName] = useState('Ami HoReSa');
  const [userCity, setUserCity] = useState('Bukavu');
  const [favoriteSpecialty, setFavoriteSpecialty] =
    useState<SpecialtyOption>('Événements');
  const [personalizeOpen, setPersonalizeOpen] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [networkModalOpen, setNetworkModalOpen] = useState(false);

  const [posts, setPosts] = useState<Post[]>(HOME_INITIAL_POSTS);
  const [stories, setStories] = useState<StoryItem[]>(HOME_STORIES);
  const [suggestions, setSuggestions] =
    useState<SuggestedProfile[]>(INITIAL_SUGGESTIONS);
  const [followedAuthorIds, setFollowedAuthorIds] = useState<string[]>([]);
  const [activeStory, setActiveStory] = useState<StoryItem | null>(null);
  const [selectedPostDetail, setSelectedPostDetail] = useState<Post | null>(
    null
  );
  const [detailFullScreen, setDetailFullScreen] = useState(false);
  const [detailAspectRatio, setDetailAspectRatio] = useState<number | null>(
    null
  );
  const [hydrated, setHydrated] = useState(false);

  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const [storyCaption, setStoryCaption] = useState('');
  const [storyImageUri, setStoryImageUri] = useState(
    STORY_PRESET_IMAGES[0].uri
  );
  const [storyMediaKind, setStoryMediaKind] = useState<MediaKind>('image');
  const [storyFromGallery, setStoryFromGallery] = useState(false);

  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedMode, setFeedMode] = useState<FeedMode>('Tout');
  const [selectedCategory, setSelectedCategory] = useState<
    'Toutes' | PostCategory
  >('Toutes');
  const [savedOnly, setSavedOnly] = useState(false);

  const [draftText, setDraftText] = useState('');
  const [draftImageUri, setDraftImageUri] = useState<string | null>(null);
  const [draftMediaKind, setDraftMediaKind] = useState<MediaKind>('image');
  const [statusBanner, setStatusBanner] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(
    null
  );
  const [commentInput, setCommentInput] = useState('');

  const topPadding =
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 12 : 12;

  const cleanUserName = userName.trim() || 'Ami HoReSa';
  const cleanUserCity = userCity.trim() || 'Bukavu';

  const responsiveContainerStyle = useMemo(
    () => ({
      width: '100%' as const,
      maxWidth: 680,
      alignSelf: 'center' as const,
    }),
    []
  );

  const responsiveModalSheetStyle = useMemo(
    () => [
      styles.modalSheet,
      responsiveContainerStyle,
      {
        maxHeight: Math.round(windowHeight * 0.88),
        paddingHorizontal: isCompactPhone ? 12 : 16,
      },
    ],
    [responsiveContainerStyle, windowHeight, isCompactPhone]
  );

  const notifyBanner = useCallback((msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => {
      setStatusBanner((prev) => (prev === msg ? '' : prev));
    }, 2600);
  }, []);

  useEffect(() => {
    let active = true;
    const loadSavedState = async () => {
      const storage = getAsyncStorage();
      let loadedPosts: Post[] = HOME_INITIAL_POSTS;

      if (storage) {
        try {
          const [
            rawPosts,
            rawStories,
            rawSuggestions,
            rawFollowedAuthors,
            rawPrefs,
          ] = await Promise.all([
            storage.getItem(STORAGE_KEYS.POSTS),
            storage.getItem(STORAGE_KEYS.STORIES),
            storage.getItem(STORAGE_KEYS.SUGGESTIONS),
            storage.getItem(STORAGE_KEYS.FOLLOWED_AUTHORS),
            storage.getItem(STORAGE_KEYS.PREFS),
          ]);

          if (!active) return;

          if (rawPosts) {
            const parsedPosts = JSON.parse(rawPosts);
            if (Array.isArray(parsedPosts) && parsedPosts.length > 0) {
              loadedPosts = parsedPosts;
              setPosts(parsedPosts);
            }
          }
          if (rawStories) {
            const parsedStories = JSON.parse(rawStories);
            if (Array.isArray(parsedStories) && parsedStories.length > 0) {
              setStories(parsedStories);
            }
          }
          if (rawSuggestions) {
            const parsedSuggestions = JSON.parse(rawSuggestions);
            if (
              Array.isArray(parsedSuggestions) &&
              parsedSuggestions.length > 0
            ) {
              setSuggestions(parsedSuggestions);
            }
          }
          if (rawFollowedAuthors) {
            const parsedFollowed = JSON.parse(rawFollowedAuthors);
            if (Array.isArray(parsedFollowed)) {
              setFollowedAuthorIds(parsedFollowed);
            }
          }
          if (rawPrefs) {
            const parsedPrefs = JSON.parse(rawPrefs);
            if (typeof parsedPrefs?.userName === 'string') {
              setUserName(parsedPrefs.userName);
            }
            if (typeof parsedPrefs?.userCity === 'string') {
              setUserCity(parsedPrefs.userCity);
            }
            if (
              parsedPrefs?.favoriteSpecialty &&
              SPECIALTIES.includes(parsedPrefs.favoriteSpecialty)
            ) {
              setFavoriteSpecialty(parsedPrefs.favoriteSpecialty);
            }
          }
        } catch {
          // Garde les données par défaut en cas de donnée corrompue
        }
      }

      const sharedPostId = getSharedPostIdFromWebUrl();
      if (sharedPostId && active) {
        const matched = loadedPosts.find((p) => p.id === sharedPostId);
        if (matched) {
          setDetailAspectRatio(null);
          setDetailFullScreen(true);
          setSelectedPostDetail(matched);
        }
      }

      if (active) setHydrated(true);
    };

    loadSavedState();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const storage = getAsyncStorage();
    if (!storage) return;

    Promise.all([
      storage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts)),
      storage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(stories)),
      storage.setItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify(suggestions)),
      storage.setItem(
        STORAGE_KEYS.FOLLOWED_AUTHORS,
        JSON.stringify(followedAuthorIds)
      ),
      storage.setItem(
        STORAGE_KEYS.PREFS,
        JSON.stringify({
          userName,
          userCity,
          favoriteSpecialty,
        })
      ),
    ]).catch(() => {
      // Ignoré si stockage indisponible
    });
  }, [
    hydrated,
    posts,
    stories,
    suggestions,
    followedAuthorIds,
    userName,
    userCity,
    favoriteSpecialty,
  ]);

  const handleResetLocalData = useCallback(async () => {
    const storage = getAsyncStorage();
    if (storage) {
      try {
        await storage.multiRemove([
          STORAGE_KEYS.POSTS,
          STORAGE_KEYS.STORIES,
          STORAGE_KEYS.SUGGESTIONS,
          STORAGE_KEYS.FOLLOWED_AUTHORS,
          STORAGE_KEYS.PREFS,
        ]);
      } catch {
        // Ignoré
      }
    }
    setPosts(HOME_INITIAL_POSTS);
    setStories(HOME_STORIES);
    setSuggestions(INITIAL_SUGGESTIONS);
    setFollowedAuthorIds([]);
    setUserName('Ami HoReSa');
    setUserCity('Bukavu');
    setFavoriteSpecialty('Événements');
    setPersonalizeOpen(false);
    setMenuOpen(false);
    notifyBanner('Données locales réinitialisées');
  }, [notifyBanner]);

  const pickMediaFromDevice = useCallback(
    async (onSelected: (uri: string, kind: MediaKind) => void) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const ImagePicker = require('expo-image-picker');
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Accès galerie requis',
            'Autorisez l’accès aux photos et vidéos de votre téléphone pour choisir un fichier.'
          );
          return;
        }

        const mediaTypes =
          ImagePicker.MediaType?.images && ImagePicker.MediaType?.videos
            ? [ImagePicker.MediaType.images, ImagePicker.MediaType.videos]
            : ['images', 'videos'];

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes,
          allowsEditing: false,
          quality: 0.9,
        });

        const asset = result.assets?.[0];
        if (!result.canceled && asset?.uri) {
          onSelected(asset.uri, inferMediaKind(asset.uri, asset.type));
        }
      } catch {
        Alert.alert(
          'Galerie indisponible',
          'Vérifiez que expo-image-picker est installé dans votre projet.'
        );
      }
    },
    []
  );

  const handlePickStoryFromGallery = useCallback(() => {
    pickMediaFromDevice((uri, kind) => {
      setStoryImageUri(uri);
      setStoryMediaKind(kind);
      setStoryFromGallery(true);
    });
  }, [pickMediaFromDevice]);

  const handlePickPostMedia = useCallback(() => {
    pickMediaFromDevice((uri, kind) => {
      setDraftImageUri(uri);
      setDraftMediaKind(kind);
    });
  }, [pickMediaFromDevice]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 350);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFeedMode('Tout');
    setSelectedCategory('Toutes');
    setSavedOnly(false);
    setSearchQuery('');
  }, []);

  const handleInviteFriends = useCallback(async () => {
    const shareUrl = buildShareUrl('accueil');
    try {
      await Share.share({
        message: `${cleanUserName} t'invite sur HoReSa Event (${cleanUserCity}) : ${shareUrl}`,
        url: shareUrl,
      });
    } catch {
      // Ignoré
    }
  }, [cleanUserName, cleanUserCity]);

  const handleToggleFollowAuthor = useCallback(
    (authorKey: string, authorLabel?: string) => {
      if (!authorKey) return;
      setFollowedAuthorIds((prev) => {
        const alreadyFollowed = prev.includes(authorKey);
        const next = alreadyFollowed
          ? prev.filter((id) => id !== authorKey)
          : [...prev, authorKey];

        syncInteractionToBackend('/follows', {
          authorKey,
          followed: !alreadyFollowed,
          actorName: cleanUserName,
        });

        notifyBanner(
          !alreadyFollowed
            ? `Vous suivez ${authorLabel || authorKey}`
            : `Vous ne suivez plus ${authorLabel || authorKey}`
        );

        return next;
      });
    },
    [cleanUserName, notifyBanner]
  );

  const handleToggleFollowSuggestion = useCallback(
    (sug: SuggestedProfile) => {
      setSuggestions((prev) =>
        prev.map((item) =>
          item.id === sug.id ? { ...item, isFollowed: !item.isFollowed } : item
        )
      );
      const authorKey = sug.handle || sug.id;
      setFollowedAuthorIds((prev) => {
        const alreadyFollowed = prev.includes(authorKey);
        const next = alreadyFollowed
          ? prev.filter((id) => id !== authorKey)
          : [...prev, authorKey];

        syncInteractionToBackend('/follows', {
          authorKey,
          followed: !alreadyFollowed,
          actorName: cleanUserName,
        });

        notifyBanner(
          !alreadyFollowed
            ? `Vous suivez ${sug.name}`
            : `Vous ne suivez plus ${sug.name}`
        );

        return next;
      });
    },
    [cleanUserName, notifyBanner]
  );

  const handleOpenStory = useCallback((story: StoryItem) => {
    setStories((prev) =>
      prev.map((item) => (item.id === story.id ? { ...item, seen: true } : item))
    );
    setActiveStory({ ...story, seen: true });
  }, []);

  const handleOpenPostDetail = useCallback((post: Post) => {
    setDetailAspectRatio(null);
    setDetailFullScreen(true);
    setSelectedPostDetail(post);
  }, []);

  const handlePublishStory = useCallback(() => {
    const caption =
      storyCaption.trim() ||
      `Moment ${favoriteSpecialty} en direct de ${cleanUserCity}`;

    const newStory: StoryItem = {
      id: `story-${Date.now()}`,
      userName: cleanUserName,
      authorName: cleanUserName,
      role: `${favoriteSpecialty} • ${cleanUserCity}`,
      caption,
      avatar: storyImageUri,
      avatarUri: storyImageUri,
      mediaUrl: storyImageUri,
      mediaType: storyMediaKind,
      seen: false,
    } as StoryItem & { mediaType: MediaKind };

    setStories((prev) => [newStory, ...prev]);
    setStoryCaption('');
    setStoryMediaKind('image');
    setStoryFromGallery(false);
    setCreateStoryOpen(false);
    notifyBanner('Story publiée et sauvegardée');
  }, [
    storyCaption,
    favoriteSpecialty,
    cleanUserCity,
    cleanUserName,
    storyImageUri,
    storyMediaKind,
    notifyBanner,
  ]);

  const handleToggleSearch = useCallback(() => {
    setSearchVisible((prev) => {
      if (prev) setSearchQuery('');
      return !prev;
    });
  }, []);

  const handlePublishPost = useCallback(() => {
    const clean = draftText.trim();
    if (!clean && !draftImageUri) return;

    const category: PostCategory =
      selectedCategory === 'Toutes' ? favoriteSpecialty : selectedCategory;

    const newPost: Post = {
      id: `home-post-${Date.now()}`,
      fromFollowing: true,
      author: {
        id: 'current-user',
        name: cleanUserName,
        handle: `@${cleanUserName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'horesa'}`,
        role: `${category} • ${cleanUserCity}`,
        verified: false,
      },
      authorName: cleanUserName,
      authorRole: `${category} • ${cleanUserCity}`,
      category,
      createdAt: 'À l’instant',
      title: `Actu ${category} — ${cleanUserCity}`,
      content: clean || `Partage ${category} depuis ${cleanUserCity}`,
      text: clean || `Partage ${category} depuis ${cleanUserCity}`,
      location: cleanUserCity,
      price: '',
      imageUrl: draftImageUri ?? undefined,
      images: draftImageUri ? [draftImageUri] : [],
      mediaType: draftImageUri ? draftMediaKind : undefined,
      likes: 0,
      likesCount: 0,
      comments: [],
      commentsCount: 0,
      shares: 0,
      sharesCount: 0,
      bookmarksCount: 0,
      isLiked: false,
      isBookmarked: false,
    } as Post & { mediaType?: MediaKind };

    setPosts((prev) => [newPost, ...prev]);
    setDraftText('');
    setDraftImageUri(null);
    setDraftMediaKind('image');
    setDetailAspectRatio(null);
    setDetailFullScreen(true);
    setSelectedPostDetail(newPost);
    notifyBanner(`Publication ajoutée en plein écran (${category})`);
  }, [
    draftText,
    draftImageUri,
    draftMediaKind,
    selectedCategory,
    favoriteSpecialty,
    cleanUserName,
    cleanUserCity,
    notifyBanner,
  ]);

  const handleToggleLike = useCallback(
    (postId: string) => {
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          const nextLiked = !post.isLiked;
          const current = post.likesCount ?? post.likes ?? 0;
          const nextCount = Math.max(0, current + (nextLiked ? 1 : -1));

          syncInteractionToBackend('/likes', {
            postId,
            liked: nextLiked,
            actorName: cleanUserName,
          });

          const updated = {
            ...post,
            isLiked: nextLiked,
            likes: nextCount,
            likesCount: nextCount,
          };
          setSelectedPostDetail((curr) => (curr?.id === postId ? updated : curr));
          return updated;
        })
      );
    },
    [cleanUserName]
  );

  const handleToggleBookmark = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const nextSaved = !post.isBookmarked;
        const current = post.bookmarksCount ?? 0;
        return {
          ...post,
          isBookmarked: nextSaved,
          bookmarksCount: Math.max(0, current + (nextSaved ? 1 : -1)),
        };
      })
    );
  }, []);

  const handleSharePost = useCallback(
    async (post: Post) => {
      const authorName = post.author?.name ?? post.authorName ?? 'HoReSa Event';
      const body = post.content ?? post.text ?? post.title ?? '';
      const shareUrl = buildShareUrl(post.id);

      try {
        await Share.share({
          message: `${authorName} — ${body}\nVoir sur le web : ${shareUrl}`,
          url: shareUrl,
        });
      } catch {
        // Ignoré
      }

      setPosts((prev) =>
        prev.map((item) => {
          if (item.id !== post.id) return item;
          const nextShares = (item.sharesCount ?? item.shares ?? 0) + 1;

          syncInteractionToBackend('/shares', {
            postId: post.id,
            shareUrl,
            actorName: cleanUserName,
          });

          const updated = {
            ...item,
            shares: nextShares,
            sharesCount: nextShares,
          };
          setSelectedPostDetail((curr) => (curr?.id === post.id ? updated : curr));
          return updated;
        })
      );

      notifyBanner(`Lien web prêt : ${shareUrl}`);
    },
    [cleanUserName, notifyBanner]
  );

  const handleAddComment = useCallback(() => {
    if (!activeCommentPostId) return;
    const clean = commentInput.trim();
    if (!clean) return;

    const newComment: PostComment = {
      id: `cmt-${Date.now()}`,
      authorName: cleanUserName,
      authorHandle: `@${cleanUserName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'horesa'}`,
      authorRole: cleanUserCity,
      content: clean,
      text: clean,
      createdAt: 'À l’instant',
    };

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== activeCommentPostId) return post;
        const nextComments = [...(post.comments ?? []), newComment];
        const nextCount = (post.commentsCount ?? post.comments?.length ?? 0) + 1;

        syncInteractionToBackend('/comments', {
          postId: activeCommentPostId,
          comment: newComment,
        });

        const updated = {
          ...post,
          comments: nextComments,
          commentsCount: nextCount,
        };
        setSelectedPostDetail((curr) =>
          curr?.id === activeCommentPostId ? updated : curr
        );
        return updated;
      })
    );
    setCommentInput('');
  }, [activeCommentPostId, commentInput, cleanUserName, cleanUserCity]);

  const isPostFollowed = useCallback(
    (post: Post) => {
      const key = getPostAuthorKey(post);
      return Boolean(post.fromFollowing || followedAuthorIds.includes(key));
    },
    [followedAuthorIds]
  );

  const visiblePosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = posts.filter((post) => {
      const followed = isPostFollowed(post);
      if (feedMode === 'Abonnés' && !followed) return false;
      if (feedMode === 'Découvrir' && followed) return false;
      if (savedOnly && !post.isBookmarked) return false;
      if (selectedCategory !== 'Toutes' && post.category !== selectedCategory) {
        return false;
      }
      if (q.length > 0) {
        const haystack = [
          post.author?.name ?? post.authorName ?? '',
          post.author?.handle ?? '',
          post.title ?? '',
          post.content ?? post.text ?? '',
          post.location ?? '',
          String(post.category ?? ''),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      const aMatch = a.category === favoriteSpecialty ? 1 : 0;
      const bMatch = b.category === favoriteSpecialty ? 1 : 0;
      return bMatch - aMatch;
    });
  }, [
    posts,
    isPostFollowed,
    feedMode,
    savedOnly,
    selectedCategory,
    searchQuery,
    favoriteSpecialty,
  ]);

  const activeCommentPost = useMemo(
    () => posts.find((p) => p.id === activeCommentPostId) ?? null,
    [posts, activeCommentPostId]
  );

  const selectedDetailMediaUri = useMemo(() => {
    if (!selectedPostDetail) return undefined;
    const anyPost = selectedPostDetail as Post & { mediaType?: MediaKind };
    return (
      anyPost.imageUrl ??
      (Array.isArray(anyPost.images) && anyPost.images.length > 0
        ? anyPost.images[0]
        : undefined)
    );
  }, [selectedPostDetail]);

  const selectedDetailMediaKind = useMemo<MediaKind>(() => {
    if (!selectedPostDetail) return 'image';
    const anyPost = selectedPostDetail as Post & { mediaType?: MediaKind };
    return anyPost.mediaType ?? inferMediaKind(selectedDetailMediaUri, null);
  }, [selectedPostDetail, selectedDetailMediaUri]);

  const renderDiscoverFilterButtons = () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: isCompactPhone ? 6 : 8 }}>
      <TouchableOpacity
        style={[styles.catPill, savedOnly && styles.catPillActive]}
        onPress={() => setSavedOnly((prev) => !prev)}
        activeOpacity={0.8}
      >
        <Text style={styles.catPillText}>
          {savedOnly ? 'Enregistrés (Actif)' : 'Enregistrés'}
        </Text>
      </TouchableOpacity>

      {CATEGORIES.map((cat) => {
        const active = selectedCategory === cat;
        return (
          <TouchableOpacity
            key={String(cat)}
            style={[styles.catPill, active && styles.catPillActive]}
            onPress={() => setSelectedCategory(cat)}
            activeOpacity={0.8}
          >
            <Text style={styles.catPillText}>{String(cat)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderHeader = () => (
    <View
      style={[
        styles.headerBlock,
        responsiveContainerStyle,
        { paddingHorizontal: isCompactPhone ? 10 : 14 },
      ]}
    >
      <View style={styles.topHeader}>
        <View style={[styles.brandGroup, { flex: 1, paddingRight: 8 }]}>
          <Image
            source={require('../../../assets/images/logohoresa.png')}
            style={[
              styles.logoImg,
              isCompactPhone && { width: 32, height: 32 },
            ]}
            resizeMode="contain"
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.brandTitle, isCompactPhone && { fontSize: 17 }]}
              numberOfLines={1}
            >
              HoReSa
            </Text>
            <Text style={styles.brandSub} numberOfLines={1}>
              {cleanUserName} • {cleanUserCity}
            </Text>
          </View>
        </View>

        <View style={[styles.topActions, isCompactPhone && { gap: 6 }]}>
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={() => setNotificationsOpen(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="notifications-outline" size={19} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconCircle}
            onPress={handleToggleSearch}
            activeOpacity={0.85}
          >
            <Ionicons
              name={searchVisible ? 'close-outline' : 'search-outline'}
              size={19}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconCircle}
            onPress={() => setMenuOpen(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="menu-outline" size={21} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {Boolean(statusBanner) ? (
        <View style={styles.networkBadge}>
          <Text style={styles.networkBadgeText}>{statusBanner}</Text>
        </View>
      ) : null}

      {personalizeOpen ? (
        <View style={styles.composerBox}>
          <Text style={styles.sectionTitle}>Personnaliser mon accueil</Text>
          <TextInput
            style={styles.composerInput}
            placeholder="Votre prénom ou nom d'affichage"
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={userName}
            onChangeText={setUserName}
          />
          <TextInput
            style={styles.composerInput}
            placeholder="Votre ville / quartier (ex. Bukavu)"
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={userCity}
            onChangeText={setUserCity}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesStrip}
          >
            {SPECIALTIES.map((spec) => {
              const active = favoriteSpecialty === spec;
              return (
                <TouchableOpacity
                  key={spec}
                  style={[styles.catPill, active && styles.catPillActive]}
                  onPress={() => setFavoriteSpecialty(spec)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.catPillText}>{spec}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.composerFooter}>
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={handleResetLocalData}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh-outline" size={15} color="#FFFFFF" />
              <Text style={styles.secondaryActionText}>Réinitialiser</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.publishBtn}
              onPress={() => {
                setPersonalizeOpen(false);
                notifyBanner('Préférences enregistrées');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.publishBtnText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {searchVisible ? (
        <View style={styles.composerBox}>
          <TextInput
            style={styles.composerInput}
            placeholder="Rechercher un lieu, une offre, une actu..."
            placeholderTextColor="rgba(255,255,255,0.65)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      ) : null}

      <View style={styles.modeRow}>
        {FEED_MODES.map((mode) => {
          const active = feedMode === mode;
          return (
            <TouchableOpacity
              key={mode}
              style={[styles.modeTab, active && styles.modeTabActive]}
              onPress={() => setFeedMode(mode)}
              activeOpacity={0.8}
            >
              <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>
                {mode}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {feedMode === 'Découvrir' ? (
        <View style={styles.composerBox}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Découvrir • Filtres principaux</Text>
            <TouchableOpacity onPress={handleResetFilters}>
              <Text style={styles.sectionLink}>Tout afficher</Text>
            </TouchableOpacity>
          </View>
          {renderDiscoverFilterButtons()}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesStrip}
        >
          {renderDiscoverFilterButtons()}
        </ScrollView>
      )}

      <StoryList
        stories={stories}
        userDisplayName={cleanUserName}
        onSelectStory={handleOpenStory}
        onCreateStory={() => setCreateStoryOpen(true)}
      />

      <View style={styles.composerBox}>
        <TextInput
          style={styles.composerInput}
          placeholder={`Publier sur l'accueil en tant que ${cleanUserName} (${favoriteSpecialty})...`}
          placeholderTextColor="rgba(255,255,255,0.65)"
          value={draftText}
          onChangeText={setDraftText}
          multiline
        />

        {draftImageUri ? (
          <View style={{ gap: 6 }}>
            <HoReSaMediaView
              uri={draftImageUri}
              kind={draftMediaKind}
              posterUri={DEFAULT_VIDEO_POSTER}
              style={styles.postImage}
              autoPlay={draftMediaKind === 'video'}
            />
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => {
                setDraftImageUri(null);
                setDraftMediaKind('image');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={15} color="#FFFFFF" />
              <Text style={styles.secondaryActionText}>
                {draftMediaKind === 'video' ? 'Retirer la vidéo' : 'Retirer la photo'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.composerFooter}>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={handlePickPostMedia}
              activeOpacity={0.8}
            >
              <Ionicons name="videocam-outline" size={16} color="#FFFFFF" />
              <Text style={styles.secondaryActionText}>Média</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => setCreateStoryOpen(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="flash-outline" size={16} color="#FFFFFF" />
              <Text style={styles.secondaryActionText}>Story</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.publishBtn}
            onPress={handlePublishPost}
            activeOpacity={0.85}
          >
            <Text style={styles.publishBtnText}>Publier</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { flex: 1, width: '100%', paddingTop: topPadding }]}>
      <StatusBar barStyle="light-content" backgroundColor="#142608" />

      <FlatList
        data={visiblePosts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={[styles.listContent, { paddingBottom: 28 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#4ADE80"
          />
        }
        ListEmptyComponent={
          <View style={[styles.postCard, responsiveContainerStyle]}>
            <Text style={styles.postText}>
              Aucune publication ne correspond à ce filtre.
            </Text>
            <TouchableOpacity
              style={styles.publishBtn}
              onPress={handleResetFilters}
              activeOpacity={0.85}
            >
              <Text style={styles.publishBtnText}>Réinitialiser les filtres</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const anyPost = item as Post & { mediaType?: MediaKind };
          const mediaUri =
            anyPost.imageUrl ??
            (Array.isArray(anyPost.images) && anyPost.images.length > 0
              ? anyPost.images[0]
              : undefined);
          const itemMediaKind =
            anyPost.mediaType ?? inferMediaKind(mediaUri, null);

          const authorKey = getPostAuthorKey(item);
          const authorLabel =
            item.author?.name ?? item.authorName ?? 'Auteur HoReSa';
          const followed = followedAuthorIds.includes(authorKey);

          const isPreferred = item.category === favoriteSpecialty;
          const badgeText = isPreferred
            ? `Pour vous (${String(item.category)})`
            : followed || item.fromFollowing
            ? 'Abonné'
            : 'Découverte';

          return (
            <View style={[responsiveContainerStyle, { marginBottom: 8 }]}>
              <TouchableOpacity
                activeOpacity={0.94}
                onPress={() => handleOpenPostDetail(item)}
              >
                <PostCard
                  post={
                    itemMediaKind === 'video'
                      ? { ...item, imageUrl: undefined, images: [] }
                      : item
                  }
                  badgeText={badgeText}
                  onToggleLike={handleToggleLike}
                  onOpenComments={(postId) => setActiveCommentPostId(postId)}
                  onShare={handleSharePost}
                  onToggleBookmark={handleToggleBookmark}
                />
                {itemMediaKind === 'video' && mediaUri ? (
                  <View style={[styles.postCard, { marginTop: -6 }]}>
                    <HoReSaMediaView
                      uri={mediaUri}
                      kind="video"
                      posterUri={DEFAULT_VIDEO_POSTER}
                      style={styles.postImage}
                      autoPlay={false}
                    />
                  </View>
                ) : null}
              </TouchableOpacity>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  paddingHorizontal: 14,
                  marginTop: -4,
                }}
              >
                <TouchableOpacity
                  style={[styles.followBtn, followed && styles.followBtnActive]}
                  onPress={() => handleToggleFollowAuthor(authorKey, authorLabel)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.followBtnText}>
                    {followed ? 'Suivi ✓' : `Suivre ${authorLabel}`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Modale publication adaptée au format photo/vidéo en plein écran */}
      <Modal
        visible={Boolean(selectedPostDetail)}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setSelectedPostDetail(null)}
      >
        <View
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            backgroundColor: '#0B1406',
            justifyContent: 'space-between',
          }}
        >
          <StatusBar barStyle="light-content" backgroundColor="#0B1406" />

          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingTop: topPadding + 60,
              paddingBottom: 120,
            }}
          >
            {selectedDetailMediaUri ? (
              <HoReSaMediaView
                uri={selectedDetailMediaUri}
                kind={selectedDetailMediaKind}
                posterUri={DEFAULT_VIDEO_POSTER}
                fullScreenVertical={detailFullScreen}
                autoPlay={selectedDetailMediaKind === 'video'}
                onAspectRatioDetected={(ratio) => setDetailAspectRatio(ratio)}
              />
            ) : (
              <View style={[responsiveContainerStyle, { padding: 20 }]}>
                <Text style={styles.postText}>
                  {selectedPostDetail?.content ??
                    selectedPostDetail?.text ??
                    selectedPostDetail?.title ??
                    ''}
                </Text>
              </View>
            )}
          </ScrollView>

          <View
            style={{
              position: 'absolute',
              top: topPadding + 8,
              left: 12,
              right: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(20, 38, 8, 0.78)',
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 14,
            }}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedPostDetail?.author?.name ??
                  selectedPostDetail?.authorName ??
                  'Publication HoReSa'}
              </Text>
              <Text style={styles.brandSub} numberOfLines={1}>
                {String(selectedPostDetail?.category ?? 'Actualité')} •{' '}
                {selectedPostDetail?.location ?? cleanUserCity}
                {detailAspectRatio
                  ? ` • ${
                      detailAspectRatio < 0.9
                        ? 'Portrait'
                        : detailAspectRatio > 1.1
                        ? 'Paysage'
                        : 'Carré'
                    }`
                  : ''}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={styles.iconCircle}
                onPress={() => setDetailFullScreen((prev) => !prev)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={detailFullScreen ? 'contract-outline' : 'expand-outline'}
                  size={19}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconCircle}
                onPress={() => setSelectedPostDetail(null)}
                activeOpacity={0.85}
              >
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {selectedPostDetail ? (
            <View
              style={{
                position: 'absolute',
                bottom: 16,
                left: 12,
                right: 12,
                backgroundColor: 'rgba(20, 38, 8, 0.84)',
                padding: 12,
                borderRadius: 14,
                gap: 8,
              }}
            >
              {selectedDetailMediaUri ? (
                <Text style={styles.commentBody} numberOfLines={2}>
                  {selectedPostDetail.content ??
                    selectedPostDetail.text ??
                    selectedPostDetail.title ??
                    ''}
                </Text>
              ) : null}

              <View style={[styles.composerFooter, { flexWrap: 'wrap', gap: 6 }]}>
                <TouchableOpacity
                  style={styles.secondaryAction}
                  onPress={() => handleToggleLike(selectedPostDetail.id)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={
                      selectedPostDetail.isLiked ? 'heart' : 'heart-outline'
                    }
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.secondaryActionText}>
                    Like (
                    {selectedPostDetail.likesCount ??
                      selectedPostDetail.likes ??
                      0}
                    )
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryAction}
                  onPress={() => {
                    const targetId = selectedPostDetail.id;
                    setSelectedPostDetail(null);
                    setActiveCommentPostId(targetId);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.secondaryActionText}>
                    Commenter (
                    {selectedPostDetail.commentsCount ??
                      selectedPostDetail.comments?.length ??
                      0}
                    )
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.publishBtn}
                  onPress={() => handleSharePost(selectedPostDetail)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.publishBtnText}>Partager</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      </Modal>

      {/* Modale Notifications */}
      <Modal
        visible={notificationsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setNotificationsOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={responsiveModalSheetStyle}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications HoReSa</Text>
              <TouchableOpacity onPress={() => setNotificationsOpen(false)}>
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.commentItem}>
                <Text style={styles.commentAuthor}>HoReSa Event • {cleanUserCity}</Text>
                <Text style={styles.commentBody}>
                  Bienvenue {cleanUserName} — vous suivez {followedAuthorIds.length} profil(s) ajouté(s).
                </Text>
              </View>

              <View style={styles.commentItem}>
                <Text style={styles.commentAuthor}>Communauté locale</Text>
                <Text style={styles.commentBody}>
                  Nouvelles stories et publications disponibles dans {cleanUserCity}.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modale Menu principal */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={responsiveModalSheetStyle}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Menu HoReSa</Text>
              <TouchableOpacity onPress={() => setMenuOpen(false)}>
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => {
                setMenuOpen(false);
                setPersonalizeOpen(true);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="options-outline" size={17} color="#FFFFFF" />
              <Text style={styles.secondaryActionText}>
                Personnaliser mon accueil
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => {
                setMenuOpen(false);
                setNetworkModalOpen(true);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="people-outline" size={17} color="#FFFFFF" />
              <Text style={styles.secondaryActionText}>
                Recommandés & Réseau
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.publishBtn}
              onPress={() => {
                setMenuOpen(false);
                handleInviteFriends();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.publishBtnText}>Inviter des amis</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={networkModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setNetworkModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={responsiveModalSheetStyle}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recommandés & Réseau HoReSa</Text>
              <TouchableOpacity onPress={() => setNetworkModalOpen(false)}>
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.publishBtn}
              onPress={handleInviteFriends}
              activeOpacity={0.85}
            >
              <Text style={styles.publishBtnText}>Inviter des amis sur HoReSa</Text>
            </TouchableOpacity>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsList}
            >
              {suggestions.map((sug) => {
                const followed =
                  sug.isFollowed ||
                  followedAuthorIds.includes(sug.handle || sug.id);
                return (
                  <View
                    key={sug.id}
                    style={[
                      styles.suggestionCard,
                      { width: Math.min(180, Math.round(windowWidth * 0.44)) },
                    ]}
                  >
                    <Image
                      source={{ uri: sug.avatarUri }}
                      style={styles.suggestionAvatar}
                      resizeMode="cover"
                    />
                    <Text style={styles.suggestionName} numberOfLines={1}>
                      {sug.name}
                    </Text>
                    <Text style={styles.suggestionMeta} numberOfLines={1}>
                      {sug.role} • {sug.city}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.followBtn,
                        followed && styles.followBtnActive,
                      ]}
                      onPress={() => handleToggleFollowSuggestion(sug)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.followBtnText}>
                        {followed ? 'Suivi ✓' : 'Suivre'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={createStoryOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateStoryOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
          >
            <View style={responsiveModalSheetStyle}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Publier une story HoReSa</Text>
                <TouchableOpacity onPress={() => setCreateStoryOpen(false)}>
                  <Ionicons name="close" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <HoReSaMediaView
                uri={storyImageUri}
                kind={storyMediaKind}
                posterUri={DEFAULT_VIDEO_POSTER}
                style={styles.postImage}
                autoPlay
              />

              <View style={styles.composerFooter}>
                <TouchableOpacity
                  style={styles.secondaryAction}
                  onPress={handlePickStoryFromGallery}
                  activeOpacity={0.85}
                >
                  <Ionicons name="folder-open-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.secondaryActionText}>
                    {storyFromGallery
                      ? 'Changer média téléphone'
                      : 'Galerie téléphone'}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.sectionLink}>
                  {storyFromGallery
                    ? storyMediaKind === 'video'
                      ? 'Vidéo sélectionnée'
                      : 'Photo sélectionnée'
                    : 'Aperçu rapide'}
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesStrip}
              >
                {STORY_PRESET_IMAGES.map((preset) => {
                  const selected = !storyFromGallery && storyImageUri === preset.uri;
                  return (
                    <TouchableOpacity
                      key={preset.label}
                      style={[styles.catPill, selected && styles.catPillActive]}
                      onPress={() => {
                        setStoryImageUri(preset.uri);
                        setStoryMediaKind('image');
                        setStoryFromGallery(false);
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.catPillText}>{preset.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TextInput
                style={styles.commentInput}
                placeholder="Écrire une courte légende pour votre story..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={storyCaption}
                onChangeText={setStoryCaption}
              />

              <TouchableOpacity
                style={styles.publishBtn}
                onPress={handlePublishStory}
                activeOpacity={0.85}
              >
                <Text style={styles.publishBtnText}>Publier la story</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modale Story plein écran vertical (style Facebook) */}
      <Modal
        visible={Boolean(activeStory)}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setActiveStory(null)}
      >
        <View
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            backgroundColor: '#0B1406',
            justifyContent: 'space-between',
          }}
        >
          <StatusBar barStyle="light-content" backgroundColor="#0B1406" />

          {(activeStory?.avatarUri ?? activeStory?.avatar) ? (
            <HoReSaMediaView
              uri={(activeStory?.avatarUri ?? activeStory?.avatar) as string}
              kind={inferMediaKind(
                activeStory?.avatarUri ?? activeStory?.avatar,
                (activeStory as any)?.mediaType
              )}
              posterUri={DEFAULT_VIDEO_POSTER}
              fullScreenVertical
              autoPlay
            />
          ) : null}

          <View
            style={{
              position: 'absolute',
              top: topPadding + 8,
              left: 12,
              right: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(20, 38, 8, 0.72)',
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 14,
            }}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {activeStory?.userName ?? activeStory?.authorName ?? 'Story HoReSa'}
              </Text>
              <Text style={styles.brandSub} numberOfLines={1}>
                {activeStory?.role ?? cleanUserCity}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.iconCircle}
              onPress={() => setActiveStory(null)}
              activeOpacity={0.85}
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View
            style={{
              position: 'absolute',
              bottom: 20,
              left: 12,
              right: 12,
              backgroundColor: 'rgba(20, 38, 8, 0.78)',
              padding: 14,
              borderRadius: 14,
            }}
          >
            <Text style={styles.commentBody}>
              {activeStory?.caption ?? 'Moment partagé sur HoReSa Event.'}
            </Text>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(activeCommentPostId)}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveCommentPostId(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={responsiveModalSheetStyle}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Commentaires (
                {activeCommentPost?.commentsCount ??
                  activeCommentPost?.comments?.length ??
                  0}
                )
              </Text>
              <TouchableOpacity onPress={() => setActiveCommentPostId(null)}>
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={[
                styles.commentsList,
                { maxHeight: Math.round(windowHeight * 0.45) },
              ]}
            >
              {(activeCommentPost?.comments ?? []).length === 0 ? (
                <Text style={styles.emptyComments}>
                  Aucun commentaire pour le moment. Lancez la discussion !
                </Text>
              ) : (
                (activeCommentPost?.comments ?? []).map((cmt) => (
                  <View key={cmt.id} style={styles.commentItem}>
                    <Text style={styles.commentAuthor}>
                      {cmt.authorName} • {cmt.createdAt}
                    </Text>
                    <Text style={styles.commentBody}>
                      {cmt.content ?? cmt.text ?? ''}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.commentComposer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Écrire un commentaire..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={commentInput}
                onChangeText={setCommentInput}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !commentInput.trim() && { opacity: 0.5 }]}
                disabled={!commentInput.trim()}
                onPress={handleAddComment}
              >
                <Ionicons name="send" size={17} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default HomeScreen;