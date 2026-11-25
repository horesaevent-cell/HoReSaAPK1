import { useEffect, useState } from 'react';
import { Post } from '../types/post';
import { HOME_POSTS_MOCK } from '../screens/Home/data/homeMockData';

export interface HomeFeedPost extends Post {
  videoUrl?: string;
}

const LIVE_POST_INTERACTIONS: {
  postId: string;
  authorName: string;
  authorHandle: string;
  content: string;
  likeDelta: number;
}[] = [
  {
    postId: 'horesa-extra-1',
    authorName: 'Béatrice Kashindi',
    authorHandle: '@bkashindi',
    content: 'J’ai testé le pack séjour affaires la semaine dernière, rien à redire.',
    likeDelta: 2,
  },
  {
    postId: 'horesa-extra-2',
    authorName: 'Christian Lwango',
    authorHandle: '@clwango',
    content: 'Le poisson grillé avec sauce maison vaut vraiment le détour !',
    likeDelta: 4,
  },
  {
    postId: 'horesa-extra-3',
    authorName: 'Dorcas Nabintu',
    authorHandle: '@dnabintu',
    content: 'Est-ce que la salle inclut le service traiteur pour 120 personnes ?',
    likeDelta: 2,
  },
  {
    postId: 'horesa-extra-4',
    authorName: 'Gédéon Bahizire',
    authorHandle: '@gbahizire',
    content: 'Parfait pour un déjeuner d’équipe en centre-ville.',
    likeDelta: 3,
  },
];

const EXTRA_HORESA_POSTS: HomeFeedPost[] = [
  {
    id: 'horesa-extra-1',
    author: {
      id: 'auth-101',
      name: 'Résidence Nyamukashe',
      handle: '@residence_nyamu',
      role: 'hotel',
      verified: true,
    },
    title: 'Pack Séjour Affaires & Détente — Vue Lac',
    content:
      'Chambres climatisées, Wi-Fi haut débit et petit-déjeuner inclus pour vos missions et week-ends sur HoReSa.',
    category: 'Hôtels',
    location: 'Bukavu • Labotte',
    price: '75 $ / nuit',
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
    ],
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    createdAt: 'Il y a 18 min',
    likesCount: 64,
    commentsCount: 2,
    sharesCount: 9,
    bookmarksCount: 14,
    isLiked: false,
    isBookmarked: false,
    comments: [
      {
        id: 'c-101',
        authorName: 'Patrick Mugisho',
        authorHandle: '@pmugisho',
        authorRole: 'particulier',
        content: 'Très bon accueil lors de mon dernier passage.',
        createdAt: 'Il y a 10 min',
      },
      {
        id: 'c-102',
        authorName: 'Sandrine Bisimwa',
        authorHandle: '@sbisimwa',
        authorRole: 'particulier',
        content: 'La connexion Wi-Fi est très stable pour travailler.',
        createdAt: 'Il y a 5 min',
      },
    ],
  },
  {
    id: 'horesa-extra-2',
    author: {
      id: 'auth-102',
      name: 'Table du Chef Kivu',
      handle: '@table_chef_kivu',
      role: 'restaurant',
      verified: true,
    },
    title: 'Formule Déjeuner & Dîner Découverte',
    content:
      'Poissons frais du lac, grillades parfumées et service rapide en salle ou terrasse avec réservation ouverte.',
    category: 'Restaurants',
    location: 'Bukavu • Muhumba',
    price: 'Dès 18 $',
    images: [
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80',
    ],
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    createdAt: 'Il y a 42 min',
    likesCount: 91,
    commentsCount: 2,
    sharesCount: 15,
    bookmarksCount: 22,
    isLiked: false,
    isBookmarked: false,
    comments: [
      {
        id: 'c-103',
        authorName: 'Yannick Kabamba',
        authorHandle: '@ykabamba',
        authorRole: 'particulier',
        content: 'Service rapide et plats bien chauds.',
        createdAt: 'Il y a 14 min',
      },
      {
        id: 'c-104',
        authorName: 'Rachelle Mwarabu',
        authorHandle: '@rmwarabu',
        authorRole: 'particulier',
        content: 'Les accompagnements sont généreux.',
        createdAt: 'Il y a 7 min',
      },
    ],
  },
  {
    id: 'horesa-extra-3',
    author: {
      id: 'auth-103',
      name: 'Espace Événements & Conférences',
      handle: '@espace_events_hr',
      role: 'salle',
      verified: true,
    },
    title: 'Salle de Réception & Séminaire Disponible',
    content:
      'Capacité de 180 places, sonorisation complète, vidéoprojecteur et option pause-café / traiteur sur mesure.',
    category: 'Salles',
    location: 'Goma • Himbi',
    price: '240 $ / jour',
    images: [
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80',
    ],
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    createdAt: 'Il y a 1 h',
    likesCount: 53,
    commentsCount: 1,
    sharesCount: 7,
    bookmarksCount: 11,
    isLiked: false,
    isBookmarked: false,
    comments: [
      {
        id: 'c-105',
        authorName: 'josue Mutabazi',
        authorHandle: '@jmutabazi',
        authorRole: 'particulier',
        content: 'Très bien équipée pour les séminaires d’entreprise.',
        createdAt: 'Il y a 20 min',
      },
    ],
  },
  {
    id: 'horesa-extra-4',
    author: {
      id: 'auth-104',
      name: 'Bistro des Collines',
      handle: '@bistro_collines',
      role: 'restaurant',
      verified: true,
    },
    title: 'Offre Spéciale Brunch & Café du Matin',
    content:
      'Viennoiseries fraîches, café d’altitude et jus pressés sur place tous les matins jusqu’à 11h30.',
    category: 'Offres',
    location: 'Bukavu • Ibanda',
    price: '12 $ / pers.',
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
    ],
    createdAt: 'Il y a 2 h',
    likesCount: 78,
    commentsCount: 1,
    sharesCount: 11,
    bookmarksCount: 19,
    isLiked: false,
    isBookmarked: false,
    comments: [
      {
        id: 'c-106',
        authorName: 'Aline Zawadi',
        authorHandle: '@azawadi',
        authorRole: 'particulier',
        content: 'Le café du Kivu y est excellent.',
        createdAt: 'Il y a 30 min',
      },
    ],
  },
];

let currentHomePosts: HomeFeedPost[] = [
  ...EXTRA_HORESA_POSTS,
  ...(HOME_POSTS_MOCK as HomeFeedPost[]),
];

let postInteractionCursor = 0;
const listeners = new Set<(items: HomeFeedPost[]) => void>();

function notify() {
  const snapshot = [...currentHomePosts];
  listeners.forEach((fn) => fn(snapshot));
}

function triggerPostInteraction() {
  if (currentHomePosts.length === 0) return;

  const step =
    LIVE_POST_INTERACTIONS[postInteractionCursor % LIVE_POST_INTERACTIONS.length];
  postInteractionCursor += 1;

  currentHomePosts = currentHomePosts.map((post) => {
    if (post.id !== step.postId) return post;

    const existing = post.comments ?? [];
    const nextComment = {
      id: `live-c-${Date.now()}-${postInteractionCursor}`,
      authorName: step.authorName,
      authorHandle: step.authorHandle,
      authorRole: 'particulier' as const,
      content: step.content,
      createdAt: 'À l’instant',
    };

    const updatedComments = [...existing.slice(-14), nextComment];

    return {
      ...post,
      likesCount: post.likesCount + step.likeDelta,
      sharesCount: (post.sharesCount ?? 0) + 1,
      comments: updatedComments,
      commentsCount: updatedComments.length,
    };
  });

  notify();
}

let postTickerStarted = false;
function ensurePostTicker() {
  if (postTickerStarted) return;
  postTickerStarted = true;
  setInterval(() => {
    triggerPostInteraction();
  }, 8000);
}

export const homePostsStore = {
  getPosts(): HomeFeedPost[] {
    ensurePostTicker();
    return [...currentHomePosts];
  },

  setPosts(
    updater: HomeFeedPost[] | ((prev: HomeFeedPost[]) => HomeFeedPost[])
  ) {
    currentHomePosts =
      typeof updater === 'function' ? updater(currentHomePosts) : updater;
    notify();
  },

  publishHomePost(newPost: Omit<HomeFeedPost, 'id'>): HomeFeedPost {
    const created: HomeFeedPost = {
      ...newPost,
      id: `home-post-${Date.now()}`,
    };
    currentHomePosts = [created, ...currentHomePosts];
    notify();
    return created;
  },

  subscribe(listener: (items: HomeFeedPost[]) => void): () => void {
    ensurePostTicker();
    listeners.add(listener);
    listener([...currentHomePosts]);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useHomePostsStore() {
  const [posts, setPosts] = useState<HomeFeedPost[]>(() =>
    homePostsStore.getPosts()
  );

  useEffect(() => {
    return homePostsStore.subscribe(setPosts);
  }, []);

  return {
    posts,
    setPosts: homePostsStore.setPosts,
    publishHomePost: homePostsStore.publishHomePost,
  };
}