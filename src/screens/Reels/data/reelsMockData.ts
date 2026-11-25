import { ReelEntry } from '../../../types/reels';
import { ReelItemData } from '../../../types/reel';

export const INITIAL_REELS_DATA: ReelEntry[] = [
  {
    id: 'reel-1',
    authorName: 'Kivu Panorama Lodge',
    handle: '@kivupanorama',
    role: 'Hôtel & Suites',
    city: 'Bukavu',
    verified: true,
    focusTag: 'Expériences',
    ambitionLabel: 'Hospitalité durable au bord du lac',
    caption:
      'Coucher de soleil sur le lac Kivu, suites rénovées et accueil personnalisé pour vos séjours.',
    audioTitle: 'Son original • Ambiance Lac & Détente',
    mediaUrl:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    durationLabel: '0:15',
    likes: 342,
    comments: [
      {
        id: 'rc-1',
        author: 'Sarah Bahati',
        text: 'La vue sur le lac est magnifique !',
        time: 'Il y a 12 min',
      },
      {
        id: 'rc-2',
        author: 'Pacifique Mungu',
        text: 'Le service en chambre est toujours rapide ici.',
        time: 'Il y a 4 min',
      },
    ],
    shares: 19,
    followers: '4,8 k',
    followingCount: '310',
    postsCount: 86,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
    isMuted: false,
  },
  {
    id: 'reel-2',
    authorName: 'Saveurs du Lac',
    handle: '@saveurs_lac',
    role: 'Restaurant & Lounge',
    city: 'Goma',
    verified: true,
    focusTag: 'Talents',
    ambitionLabel: 'Valoriser la gastronomie locale',
    caption:
      'Préparation du service du soir, grillades maison et plats signature HoReSa.',
    audioTitle: 'Son original • Service du Soir HoReSa',
    mediaUrl:
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    durationLabel: '0:22',
    likes: 518,
    comments: [
      {
        id: 'rc-3',
        author: 'David Kalume',
        text: 'Très belle présentation des assiettes.',
        time: 'Il y a 25 min',
      },
      {
        id: 'rc-4',
        author: 'Amina Furaha',
        text: 'On passe dîner ce soir avec l’équipe !',
        time: 'Il y a 6 min',
      },
    ],
    shares: 34,
    followers: '6,2 k',
    followingCount: '420',
    postsCount: 112,
    isLiked: false,
    isSaved: false,
    isFollowing: true,
    isMuted: false,
  },
  {
    id: 'reel-3',
    authorName: 'Salle Prestige Évents',
    handle: '@salle_prestige',
    role: 'Salle & Réception',
    city: 'Bukavu',
    verified: true,
    focusTag: 'Ambitions',
    ambitionLabel: 'Créer des lieux d’événements inspirants',
    caption:
      'Mise en place complète pour mariages, conférences, séminaires et soirées de gala.',
    audioTitle: 'Son original • Événements & Réceptions',
    mediaUrl:
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    durationLabel: '0:18',
    likes: 279,
    comments: [
      {
        id: 'rc-5',
        author: 'Éric Nshimirimana',
        text: 'Très bel éclairage pour les cérémonies.',
        time: 'Il y a 15 min',
      },
    ],
    shares: 12,
    followers: '3,5 k',
    followingCount: '195',
    postsCount: 64,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
    isMuted: false,
  },
  {
    id: 'reel-4',
    authorName: 'RoofTop Jardin Kivu',
    handle: '@rooftop_kivu',
    role: 'Bar & Détente',
    city: 'Bukavu',
    verified: true,
    focusTag: 'Talents',
    ambitionLabel: 'Mettre en avant les jeunes talents locaux',
    caption:
      'Soirée acoustique, jus frais locaux et vue panoramique sur la ville.',
    audioTitle: 'Son original • Lounge Soirée Kivu',
    mediaUrl:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoy.mp4',
    durationLabel: '0:19',
    likes: 405,
    comments: [
      {
        id: 'rc-6',
        author: 'Chantal Mapenzi',
        text: 'L’endroit idéal pour décompresser après le travail.',
        time: 'Il y a 8 min',
      },
    ],
    shares: 24,
    followers: '5,1 k',
    followingCount: '280',
    postsCount: 93,
    isLiked: false,
    isSaved: false,
    isFollowing: true,
    isMuted: false,
  },
];

export const reelsService = {
  resolvePlaybackUrl(reel: ReelEntry): string {
    return (reel.streamPlaybackUrl || reel.videoUrl || '').trim();
  },

  formatCreativeShareMessage(reel: ReelEntry): string {
    return `${reel.authorName} (${reel.handle}) • ${reel.focusTag} : ${reel.ambitionLabel}\n${reel.caption}`;
  },
};

export const REELS_MOCK: ReelItemData[] = INITIAL_REELS_DATA.map((entry) => {
  const resolvedUrl = reelsService.resolvePlaybackUrl(entry);
  return {
    id: entry.id,
    authorName: entry.authorName,
    authorHandle: entry.handle,
    authorRole: `${entry.role} • ${entry.city}`,
    userName: entry.authorName,
    userHandle: entry.handle,
    role: entry.role,
    city: entry.city,
    verified: entry.verified,
    caption: entry.caption,
    location: entry.city,
    tags: [entry.focusTag, entry.city, 'HoReSa'],
    videoUrl: resolvedUrl,
    streamPlaybackUrl: entry.streamPlaybackUrl,
    mediaUrl: entry.mediaUrl,
    posterUrl: entry.mediaUrl,
    thumbnailUrl: entry.mediaUrl,
    durationLabel: entry.durationLabel,
    audioTitle: entry.audioTitle,
    soundTitle: entry.audioTitle,
    likes: entry.likes,
    likesCount: entry.likes,
    comments: entry.comments.map((c) => ({
      id: c.id,
      userName: c.author,
      authorName: c.author,
      text: c.text,
      createdAt: c.time,
    })),
    commentsCount: entry.comments.length,
    shares: entry.shares,
    sharesCount: entry.shares,
    isLiked: entry.isLiked,
    isSaved: entry.isSaved,
    isFollowing: entry.isFollowing,
    isMuted: entry.isMuted,
    isPaused: false,
  };
});

export const INITIAL_REELS = REELS_MOCK;