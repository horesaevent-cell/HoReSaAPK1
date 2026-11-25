import { Post, StoryItem } from '../../../types/post';

export const HOME_STORIES: StoryItem[] = [
  {
    id: 'st-1',
    userName: 'Kivu Lodge',
    authorName: 'Kivu Panorama Lodge',
    role: 'Hôtellerie • Bukavu',
    caption: 'Terrasse au bord du lac Kivu prête pour vos rencontres.',
    avatar:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80',
    avatarUri:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80',
    seen: false,
  },
  {
    id: 'st-2',
    userName: 'Saveurs Lac',
    authorName: 'Saveurs du Lac',
    role: 'Restauration & Traiteur',
    caption: 'Nouveau menu local et service traiteur disponible à Bukavu.',
    avatar:
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=300&q=80',
    avatarUri:
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=300&q=80',
    seen: false,
  },
  {
    id: 'st-3',
    userName: 'Scène HoReSa',
    authorName: 'HoReSa Événements',
    role: 'Événementiel & Scène',
    caption: 'Rencontres créatives et professionnelles HoReSa.',
    avatar:
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=300&q=80',
    avatarUri:
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=300&q=80',
    seen: true,
  },
];

export const HOME_INITIAL_POSTS: Post[] = [
  {
    id: 'post-1',
    fromFollowing: true,
    author: {
      id: 'auth-1',
      name: 'Kivu Panorama Lodge',
      handle: '@kivupanorama',
      role: 'Hôtellerie • Bukavu',
      verified: true,
    },
    authorName: 'Kivu Panorama Lodge',
    authorRole: 'Hôtellerie • Bukavu',
    category: 'Hôtels',
    createdAt: 'Il y a 15 min',
    title: 'Accueil & Séminaires au bord du lac',
    text: 'Espaces ouverts pour vos séjours, dîners et rencontres professionnelles sur les rives du lac Kivu.',
    content:
      'Espaces ouverts pour vos séjours, dîners et rencontres professionnelles sur les rives du lac Kivu.',
    location: 'Bukavu',
    price: '$45 / nuit',
    imageUrl:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
    ],
    likes: 38,
    likesCount: 38,
    comments: [
      {
        id: 'c-1',
        authorName: 'Équipe HoReSa',
        authorHandle: '@horesa_event',
        authorRole: 'Communauté',
        text: 'Cadre idéal pour nos rencontres créatives.',
        content: 'Cadre idéal pour nos rencontres créatives.',
        createdAt: 'Il y a 8 min',
      },
    ],
    commentsCount: 1,
    shares: 5,
    sharesCount: 5,
    bookmarksCount: 9,
    isLiked: false,
    isBookmarked: false,
  },
  {
    id: 'post-2',
    fromFollowing: false,
    author: {
      id: 'auth-2',
      name: 'Saveurs du Lac',
      handle: '@saveurs_lac',
      role: 'Restauration & Traiteur',
      verified: true,
    },
    authorName: 'Saveurs du Lac',
    authorRole: 'Restauration & Traiteur',
    category: 'Restaurants',
    createdAt: 'Il y a 1 h',
    title: 'Carte de saison & Menu découverte',
    text: 'Cuisine locale revisitée, grillades et service traiteur pour vos réceptions à Bukavu.',
    content:
      'Cuisine locale revisitée, grillades et service traiteur pour vos réceptions à Bukavu.',
    location: 'Bukavu',
    price: '$14 / menu',
    imageUrl:
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80',
    ],
    likes: 54,
    likesCount: 54,
    comments: [],
    commentsCount: 0,
    shares: 8,
    sharesCount: 8,
    bookmarksCount: 12,
    isLiked: false,
    isBookmarked: false,
  },
  {
    id: 'post-3',
    fromFollowing: true,
    author: {
      id: 'auth-3',
      name: 'HoReSa Événements',
      handle: '@horesa_event',
      role: 'Événementiel & Scène',
      verified: true,
    },
    authorName: 'HoReSa Événements',
    authorRole: 'Événementiel & Scène',
    category: 'Événements',
    createdAt: 'Il y a 3 h',
    title: 'Rencontre des acteurs Hôtellerie, Restauration & Scène',
    text: 'Rejoignez notre réseau pour partager vos idées, valoriser vos talents et inviter vos proches.',
    content:
      'Rejoignez notre réseau pour partager vos idées, valoriser vos talents et inviter vos proches.',
    location: 'Bukavu • Sud-Kivu',
    price: 'Entrée libre',
    imageUrl:
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80',
    ],
    likes: 72,
    likesCount: 72,
    comments: [],
    commentsCount: 0,
    shares: 14,
    sharesCount: 14,
    bookmarksCount: 19,
    isLiked: true,
    isBookmarked: false,
  },
  {
    id: 'post-4',
    fromFollowing: false,
    author: {
      id: 'auth-4',
      name: 'Bistro des Collines',
      handle: '@bistro_collines',
      role: 'Café & Offres',
      verified: true,
    },
    authorName: 'Bistro des Collines',
    authorRole: 'Café & Offres',
    category: 'Offres',
    createdAt: 'Il y a 4 h',
    title: 'Formule Café & Rencontre Matinale',
    text: 'Café d’altitude du Kivu et viennoiseries maison pour vos échanges matinaux.',
    content:
      'Café d’altitude du Kivu et viennoiseries maison pour vos échanges matinaux.',
    location: 'Bukavu',
    price: '$10 / pers.',
    imageUrl:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
    ],
    likes: 41,
    likesCount: 41,
    comments: [],
    commentsCount: 0,
    shares: 6,
    sharesCount: 6,
    bookmarksCount: 8,
    isLiked: false,
    isBookmarked: false,
  },
];

export const HOME_POSTS_MOCK: Post[] = HOME_INITIAL_POSTS;