import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ThreadFilterMode = 'Tout' | 'Non lus';
export type StoryViewerMode = 'own' | 'friends';
export type CallType = 'audio' | 'video';

export interface StoryEngagementUser {
  id: string;
  name: string;
  role?: string;
}

export interface StorySlide {
  id: string;
  authorName: string;
  roleLabel?: string;
  avatarUrl?: string;
  caption: string;
  mediaUrl?: string;
  createdAt: string;
  isOwn?: boolean;
  viewers?: StoryEngagementUser[];
  likers?: StoryEngagementUser[];
  likedByMe?: boolean;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  sender: 'me' | 'them';
  senderName: string;
  text: string;
  createdAt: string;
  kind?: 'text' | 'voice' | 'image';
  mediaUrl?: string;
  audioUri?: string;
  durationLabel?: string;
  status?: 'sent' | 'read';
  reaction?: string;
}

export interface ChatThread {
  id: string;
  peerName: string;
  peerRole: string;
  peerCity: string;
  unreadCount: number;
  lastMessage: string;
  updatedAt: string;
}

export interface MessagingSettings {
  showSentStatus: boolean;
  autoSaveDrafts: boolean;
  quickRepliesEnabled: boolean;
}

export interface MessagesScreenProps {
  onUnreadChange?: (totalUnread: number) => void;
  headerCustomText?: string;
  userAvatarUri?: string | null;
  userName?: string;
  userOwnStories?: StorySlide[];
  friendsStories?: StorySlide[];
  currentUserId?: string;
}

const DEFAULT_HEADER_CUSTOM_TEXT = 'Jesus is god';

const WECHAT_QUICK_EMOJIS = ['👍', '❤️', '🙏', '😊', '🔥', '👏', '✨', '🍽️'];

const DEFAULT_MESSAGING_SETTINGS: MessagingSettings = {
  showSentStatus: true,
  autoSaveDrafts: true,
  quickRepliesEnabled: true,
};

const DEFAULT_OWN_STORIES: StorySlide[] = [
  {
    id: 'own-story-1',
    authorName: 'Mon profil HoReSa',
    roleLabel: 'Ma Story • Accueil',
    caption: 'Nouvelle disponibilité et accueil chaleureux sur HoReSa.',
    mediaUrl:
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1080&q=80',
    createdAt: 'Aujourd’hui',
    isOwn: true,
    likedByMe: false,
    viewers: [
      { id: 'v-1', name: 'Lac Kivu Resort', role: 'Hôtellerie' },
      { id: 'v-2', name: 'Table des Saveurs', role: 'Restauration' },
      { id: 'v-3', name: 'Kivu Scène & Son', role: 'Événementiel' },
    ],
    likers: [
      { id: 'l-1', name: 'Lac Kivu Resort', role: 'Hôtellerie' },
      { id: 'l-2', name: 'Table des Saveurs', role: 'Restauration' },
    ],
  },
];

const DEFAULT_FRIENDS_STORIES: StorySlide[] = [
  {
    id: 'friend-story-1',
    authorName: 'Lac Kivu Resort',
    roleLabel: 'Ami • Hôtellerie',
    avatarUrl:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=200&q=80',
    caption: 'Suite panoramique disponible ce week-end au bord du lac.',
    mediaUrl:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1080&q=80',
    createdAt: 'Il y a 35 min',
    isOwn: false,
    likedByMe: false,
  },
  {
    id: 'friend-story-2',
    authorName: 'Table des Saveurs',
    roleLabel: 'Ami • Restauration',
    avatarUrl:
      'https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&w=200&q=80',
    caption: 'Dégustation du menu traiteur pour réceptions & événements.',
    mediaUrl:
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1080&q=80',
    createdAt: 'Il y a 1 h',
    isOwn: false,
    likedByMe: false,
  },
];

const API_BASE_URL =
  typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_HORESA_API_URL
    ? String(process.env.EXPO_PUBLIC_HORESA_API_URL).replace(/\/+$/, '')
    : '';

const WS_BASE_URL =
  typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_HORESA_WS_URL
    ? String(process.env.EXPO_PUBLIC_HORESA_WS_URL).replace(/\/+$/, '')
    : '';

const STORAGE_KEYS = {
  THREADS: '@horesa_clean_threads_v1',
  MESSAGES: '@horesa_clean_messages_v1',
  HEADER_TEXT: '@horesa_header_quote_v1',
  CHAT_SETTINGS: '@horesa_chat_settings_v1',
  OWN_STORIES: '@horesa_user_stories_v1',
  FRIENDS_STORIES: '@horesa_friends_stories_v1',
};

const STORIES_STORAGE_CANDIDATES = [
  '@horesa_user_stories_v1',
  '@horesa_home_stories_v1',
  '@horesa_stories_v1',
];

const PROFILE_STORAGE_KEYS = [
  '@horesa_user_profile_v1',
  '@horesa_profile_v1',
  '@horesa_user_avatar_v1',
  '@horesa_active_account_v1',
];

const INITIAL_THREADS: ChatThread[] = [
  {
    id: 'thread-kivu-resort',
    peerName: 'Lac Kivu Resort',
    peerRole: 'Hôtellerie & Séjours',
    peerCity: 'Bukavu',
    unreadCount: 1,
    lastMessage: 'Bonjour, avons-nous des chambres disponibles ce week-end ?',
    updatedAt: '09:15',
  },
  {
    id: 'thread-table-saveurs',
    peerName: 'Table des Saveurs',
    peerRole: 'Restauration & Traiteur',
    peerCity: 'Bukavu',
    unreadCount: 0,
    lastMessage: 'Menu événementiel disponible pour 40 personnes.',
    updatedAt: 'Hier',
  },
  {
    id: 'thread-kivu-scene',
    peerName: 'Kivu Scène & Son',
    peerRole: 'Événementiel & Live',
    peerCity: 'Bukavu',
    unreadCount: 0,
    lastMessage: 'Devis sonorisation & scène envoyé.',
    updatedAt: 'Lun.',
  },
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  'thread-kivu-resort': [
    {
      id: 'm-1',
      threadId: 'thread-kivu-resort',
      sender: 'them',
      senderName: 'Lac Kivu Resort',
      text: 'Bienvenue sur HoReSa. Souhaitez-vous vérifier une disponibilité ou un tarif ?',
      createdAt: '09:14',
      kind: 'text',
      status: 'read',
    },
    {
      id: 'm-2',
      threadId: 'thread-kivu-resort',
      sender: 'me',
      senderName: 'Moi',
      text: 'Bonjour, avons-nous des chambres disponibles ce week-end ?',
      createdAt: '09:15',
      kind: 'text',
      status: 'read',
    },
  ],
  'thread-table-saveurs': [
    {
      id: 'm-3',
      threadId: 'thread-table-saveurs',
      sender: 'them',
      senderName: 'Table des Saveurs',
      text: 'Menu événementiel disponible pour 40 personnes.',
      createdAt: 'Hier',
      kind: 'text',
      status: 'read',
    },
  ],
  'thread-kivu-scene': [
    {
      id: 'm-4',
      threadId: 'thread-kivu-scene',
      sender: 'them',
      senderName: 'Kivu Scène & Son',
      text: 'Devis sonorisation & scène envoyé.',
      createdAt: 'Lun.',
      kind: 'text',
      status: 'read',
    },
  ],
};

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

function getExpoAudioModule(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('expo-av');
    return mod?.Audio ? mod.Audio : null;
  } catch {
    return null;
  }
}

function getImagePickerModule(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-image-picker');
  } catch {
    return null;
  }
}

function resolveImageMediaType(picker: any): any {
  const imagesEnum = picker?.MediaType?.Images ?? picker?.MediaType?.images;
  if (imagesEnum) {
    return [imagesEnum];
  }
  return ['images'];
}

function formatDuration(seconds: number): string {
  const safeSec = Math.max(1, Math.min(3599, Math.round(seconds)));
  const mins = Math.floor(safeSec / 60);
  const secs = safeSec % 60;
  return `${mins}:${secs < 10 ? `0${secs}` : secs}`;
}

function formatCallTimer(totalSec: number): string {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const mStr = mins < 10 ? `0${mins}` : `${mins}`;
  const sStr = secs < 10 ? `0${secs}` : `${secs}`;
  return `${mStr}:${sStr}`;
}

function extractAvatarAndName(raw: string | null): {
  avatarUri?: string;
  displayName?: string;
} {
  if (!raw) return {};
  const trimmed = raw.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('file://') ||
    trimmed.startsWith('data:image/')
  ) {
    return { avatarUri: trimmed };
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== 'object') return {};
    const candidateUri =
      parsed.avatarUri ??
      parsed.avatarUrl ??
      parsed.photoUri ??
      parsed.photoURL ??
      parsed.imageUri ??
      parsed.image ??
      parsed.avatar;
    const candidateName =
      parsed.displayName ?? parsed.fullName ?? parsed.name ?? parsed.username;
    return {
      avatarUri:
        typeof candidateUri === 'string' && candidateUri.trim()
          ? candidateUri.trim()
          : undefined,
      displayName:
        typeof candidateName === 'string' && candidateName.trim()
          ? candidateName.trim()
          : undefined,
    };
  } catch {
    return {};
  }
}

function splitStoriesFromRaw(raw: string | null): {
  own: StorySlide[];
  friends: StorySlide[];
} {
  if (!raw) return { own: [], friends: [] };
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { own: [], friends: [] };

    const own: StorySlide[] = [];
    const friends: StorySlide[] = [];

    parsed.forEach((item: any, idx: number) => {
      if (!item || typeof item !== 'object') return;
      const isOwnStory =
        item.isOwnStory === true ||
        item.isOwn === true ||
        item.isMine === true ||
        item.authorId === 'user-current' ||
        item.id === 'story-own';

      const media =
        item.mediaUrl ?? item.imageUrl ?? item.imageUri ?? item.photoUri;
      const caption =
        item.caption ?? item.text ?? item.title ?? 'Story HoReSa';

      const viewers: StoryEngagementUser[] = Array.isArray(item.viewers)
        ? item.viewers.map((v: any, vIdx: number) => ({
            id: String(v?.id ?? `viewer-${idx}-${vIdx}`),
            name: String(v?.name ?? v ?? 'Membre HoReSa'),
            role: typeof v?.role === 'string' ? v.role : undefined,
          }))
        : isOwnStory
        ? DEFAULT_OWN_STORIES[0].viewers ?? []
        : [];

      const likers: StoryEngagementUser[] = Array.isArray(item.likers)
        ? item.likers.map((l: any, lIdx: number) => ({
            id: String(l?.id ?? `liker-${idx}-${lIdx}`),
            name: String(l?.name ?? l ?? 'Membre HoReSa'),
            role: typeof l?.role === 'string' ? l.role : undefined,
          }))
        : isOwnStory
        ? DEFAULT_OWN_STORIES[0].likers ?? []
        : [];

      const slide: StorySlide = {
        id: String(item.id ?? `story-${idx}`),
        authorName: String(
          item.authorName ?? item.userName ?? (isOwnStory ? 'Moi' : 'Ami HoReSa')
        ),
        roleLabel:
          typeof item.roleLabel === 'string'
            ? item.roleLabel
            : typeof item.role === 'string'
            ? item.role
            : undefined,
        avatarUrl:
          typeof (item.avatarUrl ?? item.avatar ?? item.avatarUri) === 'string'
            ? String(item.avatarUrl ?? item.avatar ?? item.avatarUri)
            : undefined,
        caption: String(caption),
        mediaUrl:
          typeof media === 'string' && media.trim() ? media.trim() : undefined,
        createdAt: String(item.createdAt ?? item.time ?? 'Récemment'),
        isOwn: isOwnStory,
        viewers,
        likers,
        likedByMe: Boolean(item.likedByMe),
      };

      if (isOwnStory) {
        own.push(slide);
      } else {
        friends.push(slide);
      }
    });

    return { own, friends };
  } catch {
    return { own: [], friends: [] };
  }
}

async function persistMessageRemote(message: ChatMessage): Promise<void> {
  if (!API_BASE_URL || typeof fetch !== 'function') return;
  try {
    await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch {
    // Conservé localement dans AsyncStorage
  }
}

export const MessagesScreen: React.FC<MessagesScreenProps> = ({
  onUnreadChange,
  headerCustomText,
  userAvatarUri,
  userName,
  userOwnStories,
  friendsStories,
  currentUserId = 'me',
}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isCompact = windowWidth < 375;
  const topPadding =
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 12 : 12;

  const messagesListRef = useRef<FlatList<ChatMessage>>(null);
  const searchInputRef = useRef<TextInput>(null);
  const voiceHoldStartRef = useRef<number>(0);
  const recordingRef = useRef<any>(null);
  const soundRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [threads, setThreads] = useState<ChatThread[]>(INITIAL_THREADS);
  const [messagesByThread, setMessagesByThread] =
    useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);
  const [profileAvatarUri, setProfileAvatarUri] = useState<string | null>(
    userAvatarUri ?? null
  );
  const [profileName, setProfileName] = useState<string>(userName ?? 'Moi');

  const [ownStoriesList, setOwnStoriesList] = useState<StorySlide[]>(
    userOwnStories && userOwnStories.length > 0
      ? userOwnStories
      : DEFAULT_OWN_STORIES
  );
  const [friendsStoriesList, setFriendsStoriesList] = useState<StorySlide[]>(
    friendsStories && friendsStories.length > 0
      ? friendsStories
      : DEFAULT_FRIENDS_STORIES
  );

  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [storyViewerMode, setStoryViewerMode] = useState<StoryViewerMode>('own');
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [engagementSheetMode, setEngagementSheetMode] = useState<
    'viewers' | 'likers' | null
  >(null);
  const [storyReplyDraft, setStoryReplyDraft] = useState('');

  const [customHeaderText, setCustomHeaderText] = useState<string>(
    headerCustomText ?? DEFAULT_HEADER_CUSTOM_TEXT
  );
  const [chatSettings, setChatSettings] = useState<MessagingSettings>(
    DEFAULT_MESSAGING_SETTINGS
  );

  const [chatSettingsModalOpen, setChatSettingsModalOpen] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);

  const [threadFilter, setThreadFilter] = useState<ThreadFilterMode>('Tout');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [voiceMode, setVoiceMode] = useState(false);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [emojiTrayOpen, setEmojiTrayOpen] = useState(false);
  const [plusPanelOpen, setPlusPanelOpen] = useState(false);

  // Appel audio / vidéo
  const [activeCall, setActiveCall] = useState<{
    type: CallType;
    peerName: string;
    peerRole: string;
    status: 'Appel en cours...' | 'Connecté';
    seconds: number;
    muted: boolean;
    speakerOn: boolean;
    cameraFront: boolean;
    cameraOff: boolean;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [newThreadModalOpen, setNewThreadModalOpen] = useState(false);
  const [peerNameInput, setPeerNameInput] = useState('');
  const [peerRoleInput, setPeerRoleInput] = useState('Hôtellerie & Événements');
  const [peerCityInput, setPeerCityInput] = useState('Bukavu');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof userAvatarUri === 'string' && userAvatarUri.trim()) {
      setProfileAvatarUri(userAvatarUri.trim());
    }
  }, [userAvatarUri]);

  useEffect(() => {
    if (typeof userName === 'string' && userName.trim()) {
      setProfileName(userName.trim());
    }
  }, [userName]);

  useEffect(() => {
    if (Array.isArray(userOwnStories) && userOwnStories.length > 0) {
      setOwnStoriesList(userOwnStories);
    }
  }, [userOwnStories]);

  useEffect(() => {
    if (Array.isArray(friendsStories) && friendsStories.length > 0) {
      setFriendsStoriesList(friendsStories);
    }
  }, [friendsStories]);

  useEffect(() => {
    if (typeof headerCustomText === 'string' && headerCustomText.trim()) {
      setCustomHeaderText(headerCustomText.trim());
    }
  }, [headerCustomText]);

  // Nettoyage audio au démontage
  useEffect(() => {
    return () => {
      if (soundRef.current?.unloadAsync) {
        soundRef.current.unloadAsync().catch(() => undefined);
      }
      if (recordingRef.current?.stopAndUnloadAsync) {
        recordingRef.current.stopAndUnloadAsync().catch(() => undefined);
      }
    };
  }, []);

  // Chronomètre appel actif
  useEffect(() => {
    if (!activeCall) return;
    const connectTimer = setTimeout(() => {
      setActiveCall((prev) => (prev ? { ...prev, status: 'Connecté' } : null));
    }, 1200);

    const interval = setInterval(() => {
      setActiveCall((prev) =>
        prev ? { ...prev, seconds: prev.seconds + 1 } : null
      );
    }, 1000);

    return () => {
      clearTimeout(connectTimer);
      clearInterval(interval);
    };
  }, [activeCall?.type, activeCall?.peerName]);

  // Connexion WebSocket temps réel optionnelle (si EXPO_PUBLIC_HORESA_WS_URL est défini)
  useEffect(() => {
    if (!WS_BASE_URL || typeof WebSocket === 'undefined') return;
    try {
      const wsUrl = `${WS_BASE_URL}?userId=${encodeURIComponent(currentUserId)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(String(event.data));
          if (payload?.type === 'chat_message' && payload.message) {
            const incoming: ChatMessage = {
              ...payload.message,
              sender:
                payload.message.senderId === currentUserId ? 'me' : 'them',
            };
            const tId = String(incoming.threadId);
            setMessagesByThread((prev) => ({
              ...prev,
              [tId]: [...(prev[tId] ?? []), incoming],
            }));
            setThreads((prev) =>
              prev.map((t) =>
                t.id === tId
                  ? {
                      ...t,
                      lastMessage: incoming.text,
                      updatedAt: incoming.createdAt,
                      unreadCount:
                        activeThreadId === tId ? 0 : (t.unreadCount || 0) + 1,
                    }
                  : t
              )
            );
          }
        } catch {
          // Ignore trame non JSON
        }
      };

      return () => {
        ws.close();
        wsRef.current = null;
      };
    } catch {
      return undefined;
    }
  }, [currentUserId, activeThreadId]);

  useEffect(() => {
    let active = true;
    const loadChatAndProfile = async () => {
      const storage = getAsyncStorage();
      if (!storage) {
        if (active) setHydrated(true);
        return;
      }
      try {
        const [
          rawThreads,
          rawMessages,
          rawHeader,
          rawSettings,
          ...restEntries
        ] = await Promise.all([
          storage.getItem(STORAGE_KEYS.THREADS),
          storage.getItem(STORAGE_KEYS.MESSAGES),
          storage.getItem(STORAGE_KEYS.HEADER_TEXT),
          storage.getItem(STORAGE_KEYS.CHAT_SETTINGS),
          ...PROFILE_STORAGE_KEYS.map((k) => storage.getItem(k)),
          ...STORIES_STORAGE_CANDIDATES.map((k) => storage.getItem(k)),
          storage.getItem(STORAGE_KEYS.FRIENDS_STORIES),
        ]);
        if (!active) return;

        const rawProfiles = restEntries.slice(0, PROFILE_STORAGE_KEYS.length);
        const rawCandidateStories = restEntries.slice(
          PROFILE_STORAGE_KEYS.length,
          PROFILE_STORAGE_KEYS.length + STORIES_STORAGE_CANDIDATES.length
        );
        const rawFriendsDedicated =
          restEntries[
            PROFILE_STORAGE_KEYS.length + STORIES_STORAGE_CANDIDATES.length
          ];

        if (rawThreads) {
          const parsedT = JSON.parse(rawThreads);
          if (Array.isArray(parsedT) && parsedT.length > 0) {
            setThreads(parsedT);
          }
        }
        if (rawMessages) {
          const parsedM = JSON.parse(rawMessages);
          if (parsedM && typeof parsedM === 'object') {
            setMessagesByThread(parsedM);
          }
        }
        if (
          !headerCustomText &&
          typeof rawHeader === 'string' &&
          rawHeader.trim()
        ) {
          setCustomHeaderText(rawHeader.trim());
        }
        if (rawSettings) {
          const parsedS = JSON.parse(rawSettings);
          if (parsedS && typeof parsedS === 'object') {
            setChatSettings({
              showSentStatus:
                typeof parsedS.showSentStatus === 'boolean'
                  ? parsedS.showSentStatus
                  : true,
              autoSaveDrafts:
                typeof parsedS.autoSaveDrafts === 'boolean'
                  ? parsedS.autoSaveDrafts
                  : true,
              quickRepliesEnabled:
                typeof parsedS.quickRepliesEnabled === 'boolean'
                  ? parsedS.quickRepliesEnabled
                  : true,
            });
          }
        }

        let foundAvatar: string | undefined;
        let foundName: string | undefined;
        for (const entry of rawProfiles) {
          const info = extractAvatarAndName(entry);
          if (!foundAvatar && info.avatarUri) foundAvatar = info.avatarUri;
          if (!foundName && info.displayName) foundName = info.displayName;
        }
        if (!userAvatarUri && foundAvatar) {
          setProfileAvatarUri(foundAvatar);
        }
        if (!userName && foundName) {
          setProfileName(foundName);
        }

        let collectedOwn: StorySlide[] = [];
        let collectedFriends: StorySlide[] = [];
        for (const rawStory of rawCandidateStories) {
          const split = splitStoriesFromRaw(rawStory);
          if (split.own.length > 0 && collectedOwn.length === 0) {
            collectedOwn = split.own;
          }
          if (split.friends.length > 0 && collectedFriends.length === 0) {
            collectedFriends = split.friends;
          }
        }
        const dedicatedFriends = splitStoriesFromRaw(rawFriendsDedicated);
        if (dedicatedFriends.friends.length > 0) {
          collectedFriends = dedicatedFriends.friends;
        } else if (
          dedicatedFriends.own.length > 0 &&
          collectedFriends.length === 0
        ) {
          collectedFriends = dedicatedFriends.own;
        }

        if (
          (!userOwnStories || userOwnStories.length === 0) &&
          collectedOwn.length > 0
        ) {
          setOwnStoriesList(collectedOwn);
        }
        if (
          (!friendsStories || friendsStories.length === 0) &&
          collectedFriends.length > 0
        ) {
          setFriendsStoriesList(collectedFriends);
        }
      } catch {
        // Garde les données initiales
      } finally {
        if (active) setHydrated(true);
      }
    };
    loadChatAndProfile();
    return () => {
      active = false;
    };
  }, [headerCustomText, userAvatarUri, userName, userOwnStories, friendsStories]);

  useEffect(() => {
    if (!hydrated) return;
    const storage = getAsyncStorage();
    if (!storage) return;
    Promise.all([
      storage.setItem(STORAGE_KEYS.THREADS, JSON.stringify(threads)),
      storage.setItem(
        STORAGE_KEYS.MESSAGES,
        JSON.stringify(messagesByThread)
      ),
      storage.setItem(STORAGE_KEYS.HEADER_TEXT, customHeaderText),
      storage.setItem(STORAGE_KEYS.CHAT_SETTINGS, JSON.stringify(chatSettings)),
      storage.setItem(STORAGE_KEYS.OWN_STORIES, JSON.stringify(ownStoriesList)),
      storage.setItem(
        STORAGE_KEYS.FRIENDS_STORIES,
        JSON.stringify(friendsStoriesList)
      ),
    ]).catch(() => undefined);
  }, [
    hydrated,
    threads,
    messagesByThread,
    customHeaderText,
    chatSettings,
    ownStoriesList,
    friendsStoriesList,
  ]);

  useEffect(() => {
    if (!onUnreadChange) return;
    const total = threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0);
    onUnreadChange(total);
  }, [threads, onUnreadChange]);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) ?? null,
    [threads, activeThreadId]
  );

  const filteredThreads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return threads.filter((t) => {
      if (threadFilter === 'Non lus' && t.unreadCount <= 0) return false;
      if (!q) return true;
      return [t.peerName, t.peerRole, t.peerCity, t.lastMessage]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [threads, threadFilter, searchQuery]);

  const activeMessages = useMemo(
    () => (activeThreadId ? messagesByThread[activeThreadId] ?? [] : []),
    [messagesByThread, activeThreadId]
  );

  useEffect(() => {
    if (!activeThreadId) return;
    setVoiceMode(false);
    setRecordingVoice(false);
    setEmojiTrayOpen(false);
    setPlusPanelOpen(false);
    const timer = setTimeout(() => {
      messagesListRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timer);
  }, [activeThreadId, activeMessages.length]);

  const handleOpenThread = useCallback((threadId: string) => {
    setActiveThreadId(threadId);
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, unreadCount: 0 } : t))
    );
  }, []);

  const handleStartCall = useCallback(
    (type: CallType) => {
      if (!activeThread) return;
      setActiveCall({
        type,
        peerName: activeThread.peerName,
        peerRole: `${activeThread.peerRole} • ${activeThread.peerCity}`,
        status: 'Appel en cours...',
        seconds: 0,
        muted: false,
        speakerOn: type === 'video',
        cameraFront: true,
        cameraOff: false,
      });
    },
    [activeThread]
  );

  const handleHangupCall = useCallback(() => {
    setActiveCall(null);
  }, []);

  const handleOpenOwnStories = useCallback(() => {
    setStoryViewerMode('own');
    setActiveStoryIndex(0);
    setEngagementSheetMode(null);
    setStoryViewerOpen(true);
  }, []);

  const handleOpenFriendsStories = useCallback(() => {
    setStoryViewerMode('friends');
    setActiveStoryIndex(0);
    setEngagementSheetMode(null);
    setStoryReplyDraft('');
    setStoryViewerOpen(true);
  }, []);

  const viewerSlides =
    storyViewerMode === 'own' ? ownStoriesList : friendsStoriesList;
  const currentSlide =
    viewerSlides[activeStoryIndex] ?? viewerSlides[0] ?? null;

  const handleGoPrevStory = useCallback(() => {
    setEngagementSheetMode(null);
    setActiveStoryIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleGoNextStory = useCallback(() => {
    setEngagementSheetMode(null);
    setActiveStoryIndex((prev) => Math.min(viewerSlides.length - 1, prev + 1));
  }, [viewerSlides.length]);

  const handleToggleLikeCurrentStory = useCallback(() => {
    if (!currentSlide) return;
    if (storyViewerMode === 'own') {
      setOwnStoriesList((prev) =>
        prev.map((s, idx) => {
          if (idx !== activeStoryIndex) return s;
          const nextLiked = !s.likedByMe;
          const baseLikers = s.likers ?? [];
          const meEntry: StoryEngagementUser = {
            id: 'me-liker',
            name: profileName || 'Moi',
            role: 'Auteur',
          };
          const nextLikers = nextLiked
            ? baseLikers.some((u) => u.id === meEntry.id)
              ? baseLikers
              : [meEntry, ...baseLikers]
            : baseLikers.filter((u) => u.id !== meEntry.id);
          return { ...s, likedByMe: nextLiked, likers: nextLikers };
        })
      );
    } else {
      setFriendsStoriesList((prev) =>
        prev.map((s, idx) =>
          idx === activeStoryIndex ? { ...s, likedByMe: !s.likedByMe } : s
        )
      );
    }
  }, [currentSlide, storyViewerMode, activeStoryIndex, profileName]);

  const handleSendStoryReplyMessage = useCallback(() => {
    if (!currentSlide || storyViewerMode !== 'friends') return;
    const clean = storyReplyDraft.trim();
    if (!clean) return;

    const nowLabel = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const replySummary = `Réponse à la story : "${clean}"`;

    const existingThread = threads.find(
      (t) => t.peerName.toLowerCase() === currentSlide.authorName.toLowerCase()
    );
    const targetThreadId =
      existingThread?.id ?? `thread-story-${currentSlide.id}`;

    if (!existingThread) {
      const createdThread: ChatThread = {
        id: targetThreadId,
        peerName: currentSlide.authorName,
        peerRole: currentSlide.roleLabel || 'Contact HoReSa',
        peerCity: 'Bukavu',
        unreadCount: 0,
        lastMessage: replySummary,
        updatedAt: nowLabel,
      };
      setThreads((prev) => [createdThread, ...prev]);
    } else {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === targetThreadId
            ? { ...t, lastMessage: replySummary, updatedAt: nowLabel }
            : t
        )
      );
    }

    const msg: ChatMessage = {
      id: `msg-story-${Date.now()}`,
      threadId: targetThreadId,
      sender: 'me',
      senderName: profileName,
      text: replySummary,
      createdAt: nowLabel,
      kind: 'text',
      status: 'sent',
    };

    setMessagesByThread((prev) => ({
      ...prev,
      [targetThreadId]: [...(prev[targetThreadId] ?? []), msg],
    }));

    setStoryReplyDraft('');
    persistMessageRemote(msg);
    Alert.alert(
      'Message envoyé',
      `Votre message a été envoyé à ${currentSlide.authorName}.`
    );
  }, [currentSlide, storyViewerMode, storyReplyDraft, threads, profileName]);

  const handleOpenMessagingSettings = useCallback(() => {
    setHeaderMenuOpen(false);
    setChatSettingsModalOpen(true);
  }, []);

  const handleToggleSearch = useCallback(() => {
    setShowSearchBar((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => searchInputRef.current?.focus(), 60);
      } else {
        setSearchQuery('');
      }
      return next;
    });
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setThreads((prev) => prev.map((t) => ({ ...t, unreadCount: 0 })));
    setHeaderMenuOpen(false);
  }, []);

  const handleResetDemoMessages = useCallback(() => {
    Alert.alert(
      'Réinitialiser les discussions',
      'Voulez-vous restaurer les discussions par défaut de Horesa chat ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: () => {
            setThreads(INITIAL_THREADS);
            setMessagesByThread(INITIAL_MESSAGES);
            setActiveThreadId(null);
            setChatSettingsModalOpen(false);
          },
        },
      ]
    );
  }, []);

  const handleCreateThread = useCallback(() => {
    const cleanName = peerNameInput.trim();
    if (!cleanName) return;

    const nowLabel = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const newId = `thread-${Date.now()}`;
    const created: ChatThread = {
      id: newId,
      peerName: cleanName,
      peerRole: peerRoleInput.trim() || 'Partenaire HoReSa',
      peerCity: peerCityInput.trim() || 'Bukavu',
      unreadCount: 0,
      lastMessage: 'Nouvelle discussion démarrée.',
      updatedAt: nowLabel,
    };

    const welcomeMsg: ChatMessage = {
      id: `msg-welcome-${Date.now()}`,
      threadId: newId,
      sender: 'them',
      senderName: created.peerName,
      text: `Bonjour ! Vous pouvez envoyer votre message à ${created.peerName} (${created.peerCity}).`,
      createdAt: nowLabel,
      kind: 'text',
      status: 'read',
    };

    setThreads((prev) => [created, ...prev]);
    setMessagesByThread((prev) => ({
      ...prev,
      [newId]: [welcomeMsg],
    }));
    setPeerNameInput('');
    setNewThreadModalOpen(false);
    setActiveThreadId(newId);
  }, [peerNameInput, peerRoleInput, peerCityInput]);

  const appendChatMessage = useCallback(
    (payload: {
      text: string;
      previewSummary: string;
      kind?: 'text' | 'voice' | 'image';
      mediaUrl?: string;
      audioUri?: string;
      durationLabel?: string;
    }) => {
      if (!activeThreadId) return;
      const nowLabel = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      const msg: ChatMessage = {
        id: `msg-${Date.now()}`,
        threadId: activeThreadId,
        sender: 'me',
        senderName: profileName,
        text: payload.text,
        createdAt: nowLabel,
        kind: payload.kind ?? 'text',
        mediaUrl: payload.mediaUrl,
        audioUri: payload.audioUri,
        durationLabel: payload.durationLabel,
        status: 'sent',
      };

      setMessagesByThread((prev) => ({
        ...prev,
        [activeThreadId]: [...(prev[activeThreadId] ?? []), msg],
      }));

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? { ...t, lastMessage: payload.previewSummary, updatedAt: nowLabel }
            : t
        )
      );

      persistMessageRemote(msg);

      if (wsRef.current && wsRef.current.readyState === 1) {
        try {
          wsRef.current.send(
            JSON.stringify({
              type: 'chat_message',
              senderId: currentUserId,
              message: msg,
            })
          );
        } catch {
          // Ignore erreur WS ponctuelle
        }
      }
    },
    [activeThreadId, profileName, currentUserId]
  );

  const handleSendText = useCallback(
    (customText?: string) => {
      const clean = (customText ?? draft).trim();
      if (!clean) return;
      if (!customText) setDraft('');
      setEmojiTrayOpen(false);
      appendChatMessage({
        text: clean,
        previewSummary: clean,
        kind: 'text',
      });
    },
    [draft, appendChatMessage]
  );

  // Enregistrement audio réel via expo-av (avec repli fluide si non installé)
  const handleStartVoiceHold = useCallback(async () => {
    voiceHoldStartRef.current = Date.now();
    setRecordingVoice(true);

    const Audio = getExpoAudioModule();
    if (!Audio) return;

    try {
      if (Audio.requestPermissionsAsync) {
        const perm = await Audio.requestPermissionsAsync();
        if (!perm?.granted) return;
      }
      if (Audio.setAudioModeAsync) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }
      if (Audio.Recording) {
        const rec = new Audio.Recording();
        await rec.prepareToRecordAsync(
          Audio.RecordingOptionsPresets?.HIGH_QUALITY ?? {}
        );
        await rec.startAsync();
        recordingRef.current = rec;
      }
    } catch {
      recordingRef.current = null;
    }
  }, []);

  const handleEndVoiceHold = useCallback(async () => {
    if (!recordingVoice) return;
    setRecordingVoice(false);

    const elapsedSec = Math.max(
      1,
      Math.min(300, Math.round((Date.now() - voiceHoldStartRef.current) / 1000))
    );
    const durationLabel = formatDuration(elapsedSec);
    let recordedUri: string | undefined;

    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
        recordedUri = recordingRef.current.getURI?.() ?? undefined;
      } catch {
        recordedUri = undefined;
      } finally {
        recordingRef.current = null;
      }
    }

    appendChatMessage({
      text: `Message vocal (${durationLabel})`,
      previewSummary: `[Vocal ${durationLabel}]`,
      kind: 'voice',
      audioUri: recordedUri,
      durationLabel,
    });
  }, [recordingVoice, appendChatMessage]);

  // Lecture / arrêt réel d'une note vocale
  const handleTogglePlayVoice = useCallback(
    async (msg: ChatMessage) => {
      if (playingMessageId === msg.id) {
        setPlayingMessageId(null);
        if (soundRef.current?.stopAsync) {
          try {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
          } catch {
            // Ignoré
          }
          soundRef.current = null;
        }
        return;
      }

      if (soundRef.current?.unloadAsync) {
        try {
          await soundRef.current.unloadAsync();
        } catch {
          // Ignoré
        }
        soundRef.current = null;
      }

      setPlayingMessageId(msg.id);
      const Audio = getExpoAudioModule();

      if (Audio?.Sound && msg.audioUri) {
        try {
          if (Audio.setAudioModeAsync) {
            await Audio.setAudioModeAsync({
              allowsRecordingIOS: false,
              playsInSilentModeIOS: true,
              staysActiveInBackground: false,
            });
          }
          const { sound } = await Audio.Sound.createAsync(
            { uri: msg.audioUri },
            { shouldPlay: true }
          );
          soundRef.current = sound;
          sound.setOnPlaybackStatusUpdate((status: any) => {
            if (status?.didJustFinish) {
              setPlayingMessageId((curr) => (curr === msg.id ? null : curr));
              sound.unloadAsync().catch(() => undefined);
            }
          });
          return;
        } catch {
          // Repli sur minuteur visuel si le fichier n'est pas lisible
        }
      }

      const rawSec = Number((msg.durationLabel ?? '0:03').split(':')[1] || 3);
      const fallbackMs = Math.max(1200, Math.min(8000, rawSec * 1000));
      setTimeout(() => {
        setPlayingMessageId((curr) => (curr === msg.id ? null : curr));
      }, fallbackMs);
    },
    [playingMessageId]
  );

  const handlePickPhotoFromWeChatPanel = useCallback(
    async (source: 'library' | 'camera') => {
      setPlusPanelOpen(false);
      const picker = getImagePickerModule();
      if (!picker) {
        appendChatMessage({
          text: 'Photo partagée sur HoReSa',
          previewSummary: '[Photo]',
          kind: 'image',
          mediaUrl:
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
        });
        return;
      }
      try {
        if (source === 'camera' && picker.requestCameraPermissionsAsync) {
          const perm = await picker.requestCameraPermissionsAsync();
          if (!perm?.granted) return;
          const res = await picker.launchCameraAsync({ quality: 0.75 });
          const uri = res?.assets?.[0]?.uri;
          if (!res?.canceled && uri) {
            appendChatMessage({
              text: 'Photo prise sur place',
              previewSummary: '[Photo]',
              kind: 'image',
              mediaUrl: uri,
            });
          }
          return;
        }
        if (picker.requestMediaLibraryPermissionsAsync) {
          const perm = await picker.requestMediaLibraryPermissionsAsync();
          if (!perm?.granted) return;
        }
        const res = await picker.launchImageLibraryAsync({
          mediaTypes: resolveImageMediaType(picker),
          quality: 0.75,
        });
        const uri = res?.assets?.[0]?.uri;
        if (!res?.canceled && uri) {
          appendChatMessage({
            text: 'Photo partagée',
            previewSummary: '[Photo]',
            kind: 'image',
            mediaUrl: uri,
          });
        }
      } catch {
        // Ignoré si annulé
      }
    },
    [appendChatMessage]
  );

  const handleToggleReaction = useCallback(
    (msgId: string, emoji: string) => {
      if (!activeThreadId) return;
      setMessagesByThread((prev) => ({
        ...prev,
        [activeThreadId]: (prev[activeThreadId] ?? []).map((m) =>
          m.id === msgId
            ? { ...m, reaction: m.reaction === emoji ? undefined : emoji }
            : m
        ),
      }));
    },
    [activeThreadId]
  );

  const handleDeleteMessage = useCallback(
    (msg: ChatMessage) => {
      if (!activeThreadId) return;
      Alert.alert(
        'Options du message',
        'Que souhaitez-vous faire avec ce message ?',
        [
          {
            text: 'Réagir 👍',
            onPress: () => handleToggleReaction(msg.id, '👍'),
          },
          {
            text: 'Réagir ❤️',
            onPress: () => handleToggleReaction(msg.id, '❤️'),
          },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => {
              setMessagesByThread((prev) => {
                const remaining = (prev[activeThreadId] ?? []).filter(
                  (m) => m.id !== msg.id
                );
                const lastItem = remaining[remaining.length - 1];
                setThreads((tPrev) =>
                  tPrev.map((t) =>
                    t.id === activeThreadId
                      ? {
                          ...t,
                          lastMessage: lastItem
                            ? lastItem.text
                            : 'Aucun message',
                          updatedAt: lastItem
                            ? lastItem.createdAt
                            : t.updatedAt,
                        }
                      : t
                  )
                );
                return {
                  ...prev,
                  [activeThreadId]: remaining,
                };
              });
            },
          },
          { text: 'Annuler', style: 'cancel' },
        ]
      );
    },
    [activeThreadId, handleToggleReaction]
  );

  const userInitial = (profileName || 'U').charAt(0).toUpperCase();
  const viewersList = currentSlide?.viewers ?? [];
  const likersList = currentSlide?.likers ?? [];
  const storyStageHeight = Math.max(
    300,
    Math.min(
      Math.round(windowHeight * (storyViewerMode === 'friends' ? 0.52 : 0.58)),
      windowHeight - 230
    )
  );

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        backgroundColor: '#142608',
        paddingTop: topPadding,
      }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#142608" />

      <View
        style={{
          width: '100%',
          maxWidth: 680,
          alignSelf: 'center',
          flex: 1,
          paddingHorizontal: isCompact ? 12 : 16,
          position: 'relative',
        }}
      >
        {/* En-tête */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 14,
            paddingHorizontal: activeThread ? 4 : 12,
            marginTop: activeThread ? 0 : 6,
            borderRadius: activeThread ? 0 : 18,
            backgroundColor: activeThread
              ? 'transparent'
              : 'rgba(255, 255, 255, 0.05)',
            borderBottomWidth: 1,
            borderColor: activeThread
              ? 'rgba(255,255,255,0.1)'
              : 'rgba(74, 222, 128, 0.16)',
            gap: 8,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              flex: 1,
            }}
          >
            {activeThread ? (
              <TouchableOpacity
                onPress={() => setActiveThreadId(null)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(255,255,255,0.09)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleOpenOwnStories}
                activeOpacity={0.8}
                accessibilityLabel="Mes stories"
              >
                {profileAvatarUri ? (
                  <Image
                    source={{ uri: profileAvatarUri }}
                    resizeMode="cover"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      borderWidth: 1.5,
                      borderColor: '#4ADE80',
                      backgroundColor: 'rgba(34, 197, 94, 0.18)',
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: 'rgba(34, 197, 94, 0.18)',
                      borderWidth: 1.5,
                      borderColor: '#4ADE80',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: '#DCFCE7',
                        fontSize: 15,
                        fontWeight: '800',
                      }}
                    >
                      {userInitial}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            <View style={{ flex: 1 }}>
              {activeThread ? (
                <>
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: isCompact ? 17 : 19,
                      fontWeight: '800',
                      letterSpacing: 0.2,
                    }}
                    numberOfLines={1}
                  >
                    {activeThread.peerName}
                  </Text>
                  <Text
                    style={{ color: '#BBF7D0', fontSize: 12, marginTop: 2 }}
                    numberOfLines={1}
                  >
                    {activeThread.peerRole} • {activeThread.peerCity}
                  </Text>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={handleOpenMessagingSettings}
                    activeOpacity={0.8}
                    accessibilityLabel="Paramètres de la messagerie"
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 7,
                      flexWrap: 'nowrap',
                      alignSelf: 'flex-start',
                    }}
                  >
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: isCompact ? 16 : 18,
                        fontWeight: '800',
                        letterSpacing: 0.25,
                      }}
                      numberOfLines={1}
                    >
                      Horesa chat
                    </Text>
                    <View
                      style={{
                        backgroundColor: 'rgba(74, 222, 128, 0.16)',
                        borderWidth: 1,
                        borderColor: 'rgba(74, 222, 128, 0.35)',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 999,
                      }}
                    >
                      <Text
                        style={{
                          color: '#86EFAC',
                          fontSize: 9,
                          fontWeight: '700',
                          letterSpacing: 0.4,
                        }}
                      >
                        HORESA
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <Text
                    style={{
                      color: '#BBF7D0',
                      fontSize: 12,
                      fontStyle: 'italic',
                      fontWeight: '600',
                      marginTop: 3,
                    }}
                    numberOfLines={1}
                  >
                    {customHeaderText}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Boutons Appel Audio & Appel Vidéo dans la conversation */}
          {activeThread ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                onPress={() => handleStartCall('audio')}
                activeOpacity={0.8}
                accessibilityLabel="Appel audio"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(34, 197, 94, 0.18)',
                  borderWidth: 1,
                  borderColor: 'rgba(74, 222, 128, 0.4)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="call-outline" size={18} color="#86EFAC" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleStartCall('video')}
                activeOpacity={0.8}
                accessibilityLabel="Appel vidéo"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#22C55E',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="videocam-outline" size={19} color="#0B1406" />
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <TouchableOpacity
                onPress={handleOpenFriendsStories}
                activeOpacity={0.8}
                accessibilityLabel="Stories des amis"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="albums-outline" size={18} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleToggleSearch}
                activeOpacity={0.8}
                accessibilityLabel="Recherche"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: showSearchBar
                    ? 'rgba(34, 197, 94, 0.25)'
                    : 'rgba(255,255,255,0.08)',
                  borderWidth: 1,
                  borderColor: showSearchBar
                    ? '#4ADE80'
                    : 'rgba(255,255,255,0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="search-outline" size={18} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setHeaderMenuOpen(true)}
                activeOpacity={0.8}
                accessibilityLabel="Menu"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="ellipsis-vertical"
                  size={18}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {!activeThread ? (
          <>
            {/* Filtres discrets */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingTop: 12,
              }}
            >
              {(['Tout', 'Non lus'] as ThreadFilterMode[]).map((mode) => {
                const selected = threadFilter === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setThreadFilter(mode)}
                    activeOpacity={0.85}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      borderRadius: 18,
                      backgroundColor: selected
                        ? '#22C55E'
                        : 'rgba(255,255,255,0.07)',
                    }}
                  >
                    <Text
                      style={{
                        color: selected ? '#0B1406' : '#E2E8F0',
                        fontSize: 12,
                        fontWeight: selected ? '800' : '600',
                      }}
                    >
                      {mode}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {showSearchBar ? (
              <View style={{ paddingTop: 10, paddingBottom: 4 }}>
                <TextInput
                  ref={searchInputRef}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Rechercher une discussion ou un lieu..."
                  placeholderTextColor="rgba(255,255,255,0.55)"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: '#FFFFFF',
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 13,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                />
              </View>
            ) : null}

            <FlatList
              data={filteredThreads}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{
                paddingTop: 10,
                paddingBottom: 88,
                gap: 10,
              }}
              ListEmptyComponent={
                <View
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: 16,
                    padding: 20,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13 }}
                  >
                    Aucune discussion trouvée.
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleOpenThread(item.id)}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.07)',
                    borderRadius: 16,
                    padding: 13,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.06)',
                  }}
                >
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 23,
                      backgroundColor: 'rgba(74, 222, 128, 0.16)',
                      borderWidth: 1,
                      borderColor: 'rgba(74, 222, 128, 0.35)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: '#DCFCE7',
                        fontSize: 16,
                        fontWeight: '800',
                      }}
                    >
                      {item.peerName.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 15,
                        fontWeight: '700',
                      }}
                      numberOfLines={1}
                    >
                      {item.peerName}
                    </Text>
                    <Text
                      style={{
                        color: '#86EFAC',
                        fontSize: 11,
                        fontWeight: '600',
                      }}
                      numberOfLines={1}
                    >
                      {item.peerRole} • {item.peerCity}
                    </Text>
                    <Text
                      style={{
                        color: 'rgba(255,255,255,0.78)',
                        fontSize: 13,
                        marginTop: 2,
                      }}
                      numberOfLines={1}
                    >
                      {item.lastMessage}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Text
                      style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                    >
                      {item.updatedAt}
                    </Text>
                    {item.unreadCount > 0 ? (
                      <View
                        style={{
                          backgroundColor: '#22C55E',
                          borderRadius: 10,
                          minWidth: 20,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          style={{
                            color: '#0B1406',
                            fontSize: 11,
                            fontWeight: '800',
                          }}
                        >
                          {item.unreadCount}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              )}
            />

            {/* Bouton "Nouveau" en bas à droite en forme de stylo */}
            <TouchableOpacity
              onPress={() => setNewThreadModalOpen(true)}
              activeOpacity={0.85}
              accessibilityLabel="Nouvelle discussion"
              style={{
                position: 'absolute',
                right: isCompact ? 14 : 18,
                bottom: Platform.OS === 'ios' ? 20 : 16,
                width: 54,
                height: 54,
                borderRadius: 27,
                backgroundColor: '#22C55E',
                borderWidth: 1.5,
                borderColor: '#DCFCE7',
                alignItems: 'center',
                justifyContent: 'center',
                elevation: 6,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.35,
                shadowRadius: 5,
              }}
            >
              <Ionicons name="pencil" size={22} color="#0B1406" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Fil de messages type WeChat */}
            <FlatList
              ref={messagesListRef}
              data={activeMessages}
              keyExtractor={(m) => m.id}
              contentContainerStyle={{ paddingVertical: 10, gap: 10 }}
              renderItem={({ item }) => {
                const isMe = item.sender === 'me';
                const isPlaying = playingMessageId === item.id;
                return (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onLongPress={() => handleDeleteMessage(item)}
                    style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '78%',
                      backgroundColor: isMe
                        ? '#22C55E'
                        : 'rgba(255,255,255,0.11)',
                      borderTopLeftRadius: 14,
                      borderTopRightRadius: 14,
                      borderBottomLeftRadius: isMe ? 14 : 3,
                      borderBottomRightRadius: isMe ? 3 : 14,
                      paddingHorizontal: 13,
                      paddingVertical: 9,
                      gap: 4,
                      borderWidth: 1,
                      borderColor: isMe
                        ? 'rgba(220,252,231,0.35)'
                        : 'rgba(255,255,255,0.09)',
                    }}
                  >
                    {item.kind === 'image' && item.mediaUrl ? (
                      <Image
                        source={{ uri: item.mediaUrl }}
                        resizeMode="cover"
                        style={{
                          width: Math.min(210, windowWidth * 0.56),
                          height: 140,
                          borderRadius: 10,
                        }}
                      />
                    ) : null}

                    {item.kind === 'voice' ? (
                      <TouchableOpacity
                        onPress={() => handleTogglePlayVoice(item)}
                        activeOpacity={0.8}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          paddingVertical: 3,
                        }}
                      >
                        <Ionicons
                          name={isPlaying ? 'pause-circle' : 'play-circle'}
                          size={22}
                          color={isMe ? '#0B1406' : '#86EFAC'}
                        />
                        <Text
                          style={{
                            color: isMe ? '#0B1406' : '#FFFFFF',
                            fontSize: 13,
                            fontWeight: '700',
                          }}
                        >
                          {item.durationLabel ?? '0:03'} •{' '}
                          {isPlaying ? 'Lecture...' : 'Écouter le vocal'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <Text
                        style={{
                          color: isMe ? '#0B1406' : '#FFFFFF',
                          fontSize: 14,
                          lineHeight: 20,
                          fontWeight: isMe ? '600' : '400',
                        }}
                      >
                        {item.text}
                      </Text>
                    )}

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                        gap: 6,
                      }}
                    >
                      {item.reaction ? (
                        <Text style={{ fontSize: 12 }}>{item.reaction}</Text>
                      ) : null}
                      <Text
                        style={{
                          color: isMe
                            ? 'rgba(11, 20, 6, 0.75)'
                            : 'rgba(255,255,255,0.65)',
                          fontSize: 10,
                          fontWeight: '600',
                        }}
                      >
                        {item.createdAt}
                        {isMe && chatSettings.showSentStatus ? ' • Envoyé' : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />

            {/* Barre d'émojis rapides WeChat */}
            {emojiTrayOpen ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  borderRadius: 14,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  marginBottom: 6,
                  borderWidth: 1,
                  borderColor: 'rgba(74, 222, 128, 0.2)',
                }}
              >
                {WECHAT_QUICK_EMOJIS.map((em) => (
                  <TouchableOpacity
                    key={em}
                    onPress={() => {
                      setVoiceMode(false);
                      setDraft((prev) => `${prev}${em}`);
                    }}
                    style={{ paddingHorizontal: 4, paddingVertical: 2 }}
                  >
                    <Text style={{ fontSize: 20 }}>{em}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {/* Champ de saisie style WeChat */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 7,
                paddingVertical: 8,
                paddingHorizontal: 6,
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                borderTopWidth: 1,
                borderTopColor: 'rgba(74, 222, 128, 0.18)',
                borderRadius: 16,
                marginBottom: 4,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setVoiceMode((prev) => !prev);
                  setPlusPanelOpen(false);
                }}
                accessibilityLabel={
                  voiceMode ? 'Passer au clavier' : 'Passer au vocal'
                }
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={voiceMode ? 'keypad-outline' : 'mic-outline'}
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              {voiceMode ? (
                <TouchableOpacity
                  onPressIn={handleStartVoiceHold}
                  onPressOut={handleEndVoiceHold}
                  activeOpacity={0.85}
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 8,
                    backgroundColor: recordingVoice
                      ? '#22C55E'
                      : 'rgba(255,255,255,0.12)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: recordingVoice
                      ? '#DCFCE7'
                      : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <Text
                    style={{
                      color: recordingVoice ? '#0B1406' : '#FFFFFF',
                      fontSize: 13,
                      fontWeight: '700',
                    }}
                  >
                    {recordingVoice
                      ? 'Relâchez pour envoyer le vocal...'
                      : 'Maintenir pour parler'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Message..."
                  placeholderTextColor="rgba(255,255,255,0.52)"
                  multiline
                  style={{
                    flex: 1,
                    minHeight: 38,
                    maxHeight: 100,
                    backgroundColor: 'rgba(255,255,255,0.11)',
                    color: '#FFFFFF',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    fontSize: 14,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                />
              )}

              <TouchableOpacity
                onPress={() => {
                  setPlusPanelOpen(false);
                  setEmojiTrayOpen((prev) => !prev);
                }}
                accessibilityLabel="Émojis"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: emojiTrayOpen
                    ? 'rgba(34, 197, 94, 0.25)'
                    : 'rgba(255,255,255,0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="happy-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              {draft.trim().length > 0 && !voiceMode ? (
                <TouchableOpacity
                  onPress={() => handleSendText()}
                  accessibilityLabel="Envoyer"
                  style={{
                    paddingHorizontal: 13,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: '#22C55E',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: '#0B1406',
                      fontSize: 13,
                      fontWeight: '800',
                    }}
                  >
                    Envoyer
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setEmojiTrayOpen(false);
                    setPlusPanelOpen((prev) => !prev);
                  }}
                  accessibilityLabel="Plus d'options"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: plusPanelOpen
                      ? 'rgba(34, 197, 94, 0.25)'
                      : 'rgba(255,255,255,0.08)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="add" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Panneau d'actions WeChat (+) en bas */}
            {plusPanelOpen ? (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 16,
                  paddingVertical: 14,
                  paddingHorizontal: 10,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(74, 222, 128, 0.18)',
                }}
              >
                <TouchableOpacity
                  onPress={() => handlePickPhotoFromWeChatPanel('library')}
                  style={{ alignItems: 'center', gap: 6 }}
                >
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      backgroundColor: 'rgba(34, 197, 94, 0.16)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="image-outline" size={22} color="#86EFAC" />
                  </View>
                  <Text
                    style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}
                  >
                    Galerie
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handlePickPhotoFromWeChatPanel('camera')}
                  style={{ alignItems: 'center', gap: 6 }}
                >
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      backgroundColor: 'rgba(34, 197, 94, 0.16)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="camera-outline" size={22} color="#86EFAC" />
                  </View>
                  <Text
                    style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}
                  >
                    Caméra
                  </Text>
                </TouchableOpacity>

                {chatSettings.quickRepliesEnabled ? (
                  <TouchableOpacity
                    onPress={() => {
                      setPlusPanelOpen(false);
                      handleSendText(
                        'Bonjour, quelles sont vos disponibilités actuelles ?'
                      );
                    }}
                    style={{ alignItems: 'center', gap: 6 }}
                  >
                    <View
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 14,
                        backgroundColor: 'rgba(34, 197, 94, 0.16)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={22}
                        color="#86EFAC"
                      />
                    </View>
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 11,
                        fontWeight: '600',
                      }}
                    >
                      Disponibilité
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {chatSettings.quickRepliesEnabled ? (
                  <TouchableOpacity
                    onPress={() => {
                      setPlusPanelOpen(false);
                      handleSendText(
                        'Pouvez-vous me partager vos tarifs et offres du moment ?'
                      );
                    }}
                    style={{ alignItems: 'center', gap: 6 }}
                  >
                    <View
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 14,
                        backgroundColor: 'rgba(34, 197, 94, 0.16)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons
                        name="pricetag-outline"
                        size={22}
                        color="#86EFAC"
                      />
                    </View>
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 11,
                        fontWeight: '600',
                      }}
                    >
                      Tarifs
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </>
        )}
      </View>

      {/* Modale Appel Audio / Appel Vidéo */}
      <Modal
        visible={Boolean(activeCall)}
        transparent={false}
        animationType="slide"
        onRequestClose={handleHangupCall}
      >
        {activeCall ? (
          <View
            style={{
              flex: 1,
              backgroundColor: '#0B1606',
              paddingTop: topPadding + 24,
              paddingBottom: Platform.OS === 'ios' ? 40 : 28,
              paddingHorizontal: 24,
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  backgroundColor: 'rgba(74, 222, 128, 0.16)',
                  borderWidth: 1,
                  borderColor: 'rgba(74, 222, 128, 0.35)',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 999,
                }}
              >
                <Text
                  style={{
                    color: '#86EFAC',
                    fontSize: 11,
                    fontWeight: '800',
                  }}
                >
                  {activeCall.type === 'video'
                    ? 'APPEL VIDÉO HORESA'
                    : 'APPEL AUDIO HORESA'}
                </Text>
              </View>
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 22,
                  fontWeight: '800',
                  marginTop: 8,
                }}
              >
                {activeCall.peerName}
              </Text>
              <Text style={{ color: '#BBF7D0', fontSize: 13 }}>
                {activeCall.peerRole}
              </Text>
              <Text
                style={{
                  color: '#4ADE80',
                  fontSize: 15,
                  fontWeight: '700',
                  marginTop: 4,
                }}
              >
                {activeCall.status} • {formatCallTimer(activeCall.seconds)}
              </Text>
            </View>

            <View
              style={{
                width: activeCall.type === 'video' ? '100%' : 124,
                height: activeCall.type === 'video' ? 260 : 124,
                borderRadius: activeCall.type === 'video' ? 24 : 62,
                backgroundColor: 'rgba(34, 197, 94, 0.14)',
                borderWidth: 2,
                borderColor: '#4ADE80',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Ionicons
                name={
                  activeCall.type === 'video'
                    ? activeCall.cameraOff
                      ? 'videocam-off'
                      : 'videocam'
                    : 'call'
                }
                size={activeCall.type === 'video' ? 46 : 44}
                color="#86EFAC"
              />
              {activeCall.type === 'video' ? (
                <Text
                  style={{
                    color: '#DCFCE7',
                    fontSize: 13,
                    fontWeight: '600',
                  }}
                >
                  {activeCall.cameraOff
                    ? 'Caméra désactivée'
                    : activeCall.cameraFront
                    ? 'Caméra avant active'
                    : 'Caméra arrière active'}
                </Text>
              ) : null}
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 18,
              }}
            >
              <TouchableOpacity
                onPress={() =>
                  setActiveCall((prev) =>
                    prev ? { ...prev, muted: !prev.muted } : null
                  )
                }
                accessibilityLabel="Micro"
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  backgroundColor: activeCall.muted
                    ? '#FFFFFF'
                    : 'rgba(255,255,255,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={activeCall.muted ? 'mic-off' : 'mic'}
                  size={22}
                  color={activeCall.muted ? '#0B1406' : '#FFFFFF'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  setActiveCall((prev) =>
                    prev ? { ...prev, speakerOn: !prev.speakerOn } : null
                  )
                }
                accessibilityLabel="Haut-parleur"
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  backgroundColor: activeCall.speakerOn
                    ? '#22C55E'
                    : 'rgba(255,255,255,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="volume-high"
                  size={22}
                  color={activeCall.speakerOn ? '#0B1406' : '#FFFFFF'}
                />
              </TouchableOpacity>

              {activeCall.type === 'video' ? (
                <TouchableOpacity
                  onPress={() =>
                    setActiveCall((prev) =>
                      prev ? { ...prev, cameraFront: !prev.cameraFront } : null
                    )
                  }
                  accessibilityLabel="Retourner la caméra"
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 27,
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="camera-reverse" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                onPress={handleHangupCall}
                accessibilityLabel="Raccrocher"
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: '#EF4444',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="call" size={26} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </Modal>

      {/* Visionneuse Plein Écran Adaptatif HoReSa */}
      <Modal
        visible={storyViewerOpen}
        transparent={false}
        animationType="fade"
        onRequestClose={() => {
          setEngagementSheetMode(null);
          setStoryViewerOpen(false);
        }}
      >
        <KeyboardAvoidingView
          style={{
            flex: 1,
            width: windowWidth,
            height: windowHeight,
            backgroundColor: '#0C1807',
            paddingTop: topPadding + 10,
            paddingBottom: Platform.OS === 'ios' ? 26 : 16,
            paddingHorizontal: isCompact ? 12 : 18,
            justifyContent: 'space-between',
          }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 5 }}>
              {viewerSlides.map((s, idx) => (
                <View
                  key={s.id}
                  style={{
                    flex: 1,
                    height: 3.5,
                    borderRadius: 2,
                    backgroundColor:
                      idx <= activeStoryIndex
                        ? '#22C55E'
                        : 'rgba(255,255,255,0.2)',
                  }}
                />
              ))}
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderWidth: 1,
                borderColor: 'rgba(74, 222, 128, 0.22)',
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 10,
                gap: 10,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  flex: 1,
                }}
              >
                {currentSlide?.avatarUrl ||
                (storyViewerMode === 'own' && profileAvatarUri) ? (
                  <Image
                    source={{
                      uri:
                        currentSlide?.avatarUrl ?? profileAvatarUri ?? '',
                    }}
                    resizeMode="cover"
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      borderWidth: 1.5,
                      borderColor: '#4ADE80',
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      backgroundColor: 'rgba(34, 197, 94, 0.22)',
                      borderWidth: 1.5,
                      borderColor: '#4ADE80',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: '#DCFCE7',
                        fontSize: 14,
                        fontWeight: '800',
                      }}
                    >
                      {(currentSlide?.authorName ?? profileName)
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 15,
                        fontWeight: '800',
                      }}
                      numberOfLines={1}
                    >
                      {storyViewerMode === 'own'
                        ? `${profileName} • Mes stories`
                        : currentSlide?.authorName ?? 'Story d’ami'}
                    </Text>
                    <View
                      style={{
                        backgroundColor: 'rgba(74, 222, 128, 0.16)',
                        paddingHorizontal: 6,
                        paddingVertical: 1,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: '#86EFAC',
                          fontSize: 9,
                          fontWeight: '700',
                        }}
                      >
                        HORESA
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{ color: '#BBF7D0', fontSize: 11 }}
                    numberOfLines={1}
                  >
                    {storyViewerMode === 'own'
                      ? 'Publiée sur l’accueil'
                      : currentSlide?.roleLabel ?? 'Amis HoReSa'}{' '}
                    • {activeStoryIndex + 1}/{Math.max(1, viewerSlides.length)} •{' '}
                    {currentSlide?.createdAt ?? ''}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setEngagementSheetMode(null);
                  setStoryViewerOpen(false);
                }}
                accessibilityLabel="Fermer la story"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flex: 1, justifyContent: 'center', gap: 12 }}>
            <View
              style={{
                width: '100%',
                height: storyStageHeight,
                borderRadius: 22,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'rgba(74, 222, 128, 0.25)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                position: 'relative',
              }}
            >
              {currentSlide?.mediaUrl ? (
                <Image
                  source={{ uri: currentSlide.mediaUrl }}
                  resizeMode="cover"
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 20,
                  }}
                >
                  <Text
                    style={{
                      color: 'rgba(255,255,255,0.75)',
                      fontSize: 14,
                      textAlign: 'center',
                    }}
                  >
                    {storyViewerMode === 'own'
                      ? 'Aucune story personnelle publiée sur l’accueil pour le moment.'
                      : 'Aucune story d’ami disponible pour le moment.'}
                  </Text>
                </View>
              )}

              <View
                style={{
                  ...({
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    flexDirection: 'row',
                  } as any),
                }}
              >
                <TouchableOpacity
                  onPress={handleGoPrevStory}
                  activeOpacity={1}
                  accessibilityLabel="Story précédente"
                  style={{ flex: 1 }}
                />
                <TouchableOpacity
                  onPress={handleGoNextStory}
                  activeOpacity={1}
                  accessibilityLabel="Story suivante"
                  style={{ flex: 1 }}
                />
              </View>
            </View>

            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.07)',
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 11,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 14,
                  lineHeight: 20,
                  fontWeight: '600',
                }}
              >
                {currentSlide?.caption ?? ''}
              </Text>
            </View>

            {storyViewerMode === 'own' && engagementSheetMode ? (
              <View
                style={{
                  backgroundColor: '#1B330B',
                  borderRadius: 16,
                  padding: 12,
                  gap: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(74, 222, 128, 0.3)',
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
                    style={{ color: '#86EFAC', fontSize: 12, fontWeight: '800' }}
                  >
                    {engagementSheetMode === 'viewers'
                      ? `Ont vu cette story (${viewersList.length})`
                      : `Ont liké cette story (${likersList.length})`}
                  </Text>
                  <TouchableOpacity onPress={() => setEngagementSheetMode(null)}>
                    <Ionicons name="close" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {(engagementSheetMode === 'viewers'
                  ? viewersList
                  : likersList
                ).length === 0 ? (
                  <Text
                    style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}
                  >
                    Aucune activité enregistrée pour le moment.
                  </Text>
                ) : (
                  (engagementSheetMode === 'viewers'
                    ? viewersList
                    : likersList
                  ).map((person) => (
                    <View
                      key={person.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: 3,
                      }}
                    >
                      <Text
                        style={{
                          color: '#FFFFFF',
                          fontSize: 13,
                          fontWeight: '600',
                        }}
                      >
                        {person.name}
                      </Text>
                      {person.role ? (
                        <Text style={{ color: '#BBF7D0', fontSize: 11 }}>
                          {person.role}
                        </Text>
                      ) : null}
                    </View>
                  ))
                )}
              </View>
            ) : null}
          </View>

          {storyViewerMode === 'own' ? (
            <View style={{ flexDirection: 'row', gap: 10, paddingTop: 8 }}>
              <TouchableOpacity
                onPress={() =>
                  setEngagementSheetMode((prev) =>
                    prev === 'viewers' ? null : 'viewers'
                  )
                }
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  backgroundColor:
                    engagementSheetMode === 'viewers'
                      ? 'rgba(34, 197, 94, 0.25)'
                      : 'rgba(255,255,255,0.09)',
                  borderRadius: 14,
                  paddingVertical: 11,
                  borderWidth: 1,
                  borderColor: 'rgba(74, 222, 128, 0.3)',
                }}
              >
                <Ionicons name="eye-outline" size={18} color="#86EFAC" />
                <Text
                  style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}
                >
                  Vues ({viewersList.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  setEngagementSheetMode((prev) =>
                    prev === 'likers' ? null : 'likers'
                  )
                }
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  backgroundColor:
                    engagementSheetMode === 'likers'
                      ? 'rgba(34, 197, 94, 0.25)'
                      : 'rgba(255,255,255,0.09)',
                  borderRadius: 14,
                  paddingVertical: 11,
                  borderWidth: 1,
                  borderColor: 'rgba(74, 222, 128, 0.3)',
                }}
              >
                <Ionicons name="heart-outline" size={18} color="#86EFAC" />
                <Text
                  style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}
                >
                  Likes ({likersList.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleToggleLikeCurrentStory}
                accessibilityLabel="Liker ma story"
                style={{
                  width: 44,
                  borderRadius: 14,
                  backgroundColor: currentSlide?.likedByMe
                    ? '#22C55E'
                    : 'rgba(255,255,255,0.09)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={currentSlide?.likedByMe ? 'heart' : 'heart-outline'}
                  size={20}
                  color={currentSlide?.likedByMe ? '#0B1406' : '#FFFFFF'}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingTop: 8,
              }}
            >
              <TextInput
                value={storyReplyDraft}
                onChangeText={setStoryReplyDraft}
                placeholder={`Envoyer un message à ${currentSlide?.authorName ?? 'l’auteur'}...`}
                placeholderTextColor="rgba(255,255,255,0.55)"
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#FFFFFF',
                  borderRadius: 22,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  fontSize: 13,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
              />

              <TouchableOpacity
                onPress={handleToggleLikeCurrentStory}
                accessibilityLabel="Liker la story"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: currentSlide?.likedByMe
                    ? 'rgba(34, 197, 94, 0.25)'
                    : 'rgba(255,255,255,0.09)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={currentSlide?.likedByMe ? 'heart' : 'heart-outline'}
                  size={19}
                  color={currentSlide?.likedByMe ? '#4ADE80' : '#FFFFFF'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSendStoryReplyMessage}
                disabled={!storyReplyDraft.trim()}
                accessibilityLabel="Envoyer le message de story"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: '#22C55E',
                  opacity: storyReplyDraft.trim() ? 1 : 0.45,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="send" size={18} color="#0B1406" />
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>

      {/* Fenêtre Paramètres de la messagerie */}
      <Modal
        visible={chatSettingsModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setChatSettingsModalOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.65)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: '#1B330B',
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              padding: 18,
              gap: 14,
              width: '100%',
              maxWidth: 680,
              alignSelf: 'center',
              borderTopWidth: 1,
              borderColor: 'rgba(74, 222, 128, 0.25)',
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
                style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}
              >
                Paramètres de la messagerie • Horesa chat
              </Text>
              <TouchableOpacity onPress={() => setChatSettingsModalOpen(false)}>
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 14, flex: 1 }}>
                Afficher la mention "Envoyé" sur mes messages
              </Text>
              <Switch
                value={chatSettings.showSentStatus}
                onValueChange={(val) =>
                  setChatSettings((prev) => ({ ...prev, showSentStatus: val }))
                }
                trackColor={{ false: '#334155', true: '#22C55E' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 14, flex: 1 }}>
                Afficher les raccourcis rapides HoReSa
              </Text>
              <Switch
                value={chatSettings.quickRepliesEnabled}
                onValueChange={(val) =>
                  setChatSettings((prev) => ({
                    ...prev,
                    quickRepliesEnabled: val,
                  }))
                }
                trackColor={{ false: '#334155', true: '#22C55E' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 14, flex: 1 }}>
                Sauvegarde locale automatique des fils
              </Text>
              <Switch
                value={chatSettings.autoSaveDrafts}
                onValueChange={(val) =>
                  setChatSettings((prev) => ({ ...prev, autoSaveDrafts: val }))
                }
                trackColor={{ false: '#334155', true: '#22C55E' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <TouchableOpacity
              onPress={handleResetDemoMessages}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.16)',
                borderWidth: 1,
                borderColor: 'rgba(248, 113, 113, 0.4)',
                borderRadius: 14,
                paddingVertical: 11,
                alignItems: 'center',
              }}
            >
              <Text
                style={{ color: '#FCA5A5', fontSize: 13, fontWeight: '700' }}
              >
                Réinitialiser l'historique des discussions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setChatSettingsModalOpen(false)}
              style={{
                backgroundColor: '#22C55E',
                borderRadius: 14,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text
                style={{ color: '#0B1406', fontSize: 14, fontWeight: '800' }}
              >
                Fermer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Menu contextuel à droite de l'en-tête */}
      <Modal
        visible={headerMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setHeaderMenuOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setHeaderMenuOpen(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'flex-start',
            alignItems: 'flex-end',
            paddingTop: topPadding + 62,
            paddingRight: isCompact ? 12 : 18,
          }}
        >
          <View
            style={{
              backgroundColor: '#1B330B',
              borderRadius: 16,
              paddingVertical: 8,
              minWidth: 220,
              borderWidth: 1,
              borderColor: 'rgba(74, 222, 128, 0.28)',
              gap: 2,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setHeaderMenuOpen(false);
                handleOpenFriendsStories();
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Ionicons name="albums-outline" size={18} color="#86EFAC" />
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>
                Stories des amis
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleOpenMessagingSettings}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Ionicons name="settings-outline" size={18} color="#86EFAC" />
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>
                Paramètres messagerie
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleMarkAllRead}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Ionicons
                name="checkmark-done-outline"
                size={18}
                color="#86EFAC"
              />
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>
                Tout marquer comme lu
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modale Nouvelle discussion */}
      <Modal
        visible={newThreadModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setNewThreadModalOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.65)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: '#1B330B',
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              padding: 18,
              gap: 12,
              width: '100%',
              maxWidth: 680,
              alignSelf: 'center',
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
                style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}
              >
                Nouvelle discussion • Horesa chat
              </Text>
              <TouchableOpacity onPress={() => setNewThreadModalOpen(false)}>
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <TextInput
              value={peerNameInput}
              onChangeText={setPeerNameInput}
              placeholder="Nom de l'hôtel, restaurant ou organisateur"
              placeholderTextColor="rgba(255,255,255,0.55)"
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#FFFFFF',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
              }}
            />

            <TextInput
              value={peerRoleInput}
              onChangeText={setPeerRoleInput}
              placeholder="Catégorie (ex. Hôtellerie, Restauration, Événements)"
              placeholderTextColor="rgba(255,255,255,0.55)"
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#FFFFFF',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
              }}
            />

            <TextInput
              value={peerCityInput}
              onChangeText={setPeerCityInput}
              placeholder="Ville / quartier (ex. Bukavu)"
              placeholderTextColor="rgba(255,255,255,0.55)"
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#FFFFFF',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
              }}
            />

            <TouchableOpacity
              onPress={handleCreateThread}
              disabled={!peerNameInput.trim()}
              style={{
                backgroundColor: '#22C55E',
                opacity: peerNameInput.trim() ? 1 : 0.45,
                borderRadius: 14,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text
                style={{ color: '#0B1406', fontSize: 14, fontWeight: '800' }}
              >
                Démarrer la discussion
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default MessagesScreen;