import { ReelItemData } from '../../types/reels';

export const REELS_MOCK_DATA: ReelItemData[] = [
  {
    id: 'reel-mock-1',
    userName: 'Kivu Panorama Lodge',
    authorName: 'Kivu Panorama Lodge',
    authorRole: 'Hôtel & Suites',
    userHandle: '@kivupanorama',
    handle: '@kivupanorama',
    role: 'Hôtel & Suites',
    city: 'Bukavu',
    category: 'Hôtels',
    verified: true,
    caption:
      'Coucher de soleil sur le lac Kivu, suites rénovées et accueil personnalisé pour vos séjours.',
    tags: ['Hôtels', 'Bukavu', 'Lac Kivu', 'Séjours'],
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
    mediaUrl:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
    duration: '0:15',
    durationLabel: '0:15',
    likes: 342,
    likesCount: 342,
    comments: [
      {
        id: 'rcm-1',
        userName: 'Sarah Bahati',
        text: 'La vue sur le lac est magnifique !',
        createdAt: 'Il y a 12 min',
      },
    ],
    shares: 19,
    isLiked: false,
    isBookmarked: false,
    isSaved: false,
    isFollowing: false,
    isMuted: false,
    isPaused: false,
    createdAt: 'Il y a 1 h',
  },
  {
    id: 'reel-mock-2',
    userName: 'Saveurs du Lac',
    authorName: 'Saveurs du Lac',
    authorRole: 'Restaurant & Lounge',
    userHandle: '@saveurs_lac',
    handle: '@saveurs_lac',
    role: 'Restaurant & Lounge',
    city: 'Goma',
    category: 'Restaurants',
    verified: true,
    caption:
      'Préparation du service du soir, grillades maison et plats signature HoReSa.',
    tags: ['Restaurants', 'Goma', 'Gastronomie', 'Lounge'],
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80',
    mediaUrl:
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80',
    duration: '0:22',
    durationLabel: '0:22',
    likes: 518,
    likesCount: 518,
    comments: [
      {
        id: 'rcm-2',
        userName: 'David Kalume',
        text: 'Très belle présentation des assiettes.',
        createdAt: 'Il y a 25 min',
      },
    ],
    shares: 34,
    isLiked: false,
    isBookmarked: false,
    isSaved: false,
    isFollowing: true,
    isMuted: false,
    isPaused: false,
    createdAt: 'Il y a 2 h',
  },
  {
    id: 'reel-mock-3',
    userName: 'Salle Prestige Évents',
    authorName: 'Salle Prestige Évents',
    authorRole: 'Salle & Réception',
    userHandle: '@salle_prestige',
    handle: '@salle_prestige',
    role: 'Salle & Réception',
    city: 'Bukavu',
    category: 'Salles',
    verified: true,
    caption:
      'Mise en place complète pour mariages, conférences, séminaires et soirées de gala.',
    tags: ['Salles', 'Événements', 'Conférences', 'Bukavu'],
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80',
    mediaUrl:
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80',
    duration: '0:18',
    durationLabel: '0:18',
    likes: 279,
    likesCount: 279,
    comments: [],
    shares: 12,
    isLiked: false,
    isBookmarked: false,
    isSaved: false,
    isFollowing: false,
    isMuted: false,
    isPaused: false,
    createdAt: 'Il y a 3 h',
  },
];

export default REELS_MOCK_DATA;