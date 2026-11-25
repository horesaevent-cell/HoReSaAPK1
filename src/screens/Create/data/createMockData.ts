export type CreateDraftType = 'post' | 'event' | 'announcement' | 'reel';

export interface CreateTypeOption {
  key: CreateDraftType;
  label: string;
  description: string;
  icon:
    | 'newspaper-outline'
    | 'calendar-outline'
    | 'megaphone-outline'
    | 'videocam-outline';
}

export interface MediaPreset {
  id: string;
  label: string;
  url: string;
  forReel?: boolean;
}

export const CURRENT_CREATE_AUTHOR = {
  id: 'user-current',
  fullName: 'Amina Kabila',
  handle: '@aminakabila',
  roleLabel: 'Directrice Événementiel • HoReSa',
  avatarUrl:
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
  isVerified: true,
};

export const CREATE_TYPE_OPTIONS: CreateTypeOption[] = [
  {
    key: 'post',
    label: 'Publication',
    description: 'Partager une actualité ou un retour d’expérience du terrain.',
    icon: 'newspaper-outline',
  },
  {
    key: 'event',
    label: 'Événement',
    description: 'Annoncer une conférence, un gala, un séminaire ou un salon.',
    icon: 'calendar-outline',
  },
  {
    key: 'announcement',
    label: 'Annonce',
    description: 'Publier un recrutement, un appel à prestataires ou une offre.',
    icon: 'megaphone-outline',
  },
  {
    key: 'reel',
    label: 'Reel Vidéo',
    description: 'Publier une courte vidéo verticale dans l’onglet Reels.',
    icon: 'videocam-outline',
  },
];

export const MEDIA_PRESETS: MediaPreset[] = [
  {
    id: 'preset-event',
    label: 'Salle Conférence',
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'preset-catering',
    label: 'Service Traiteur',
    url: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'preset-hotel',
    label: 'Hôtellerie',
    url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'preset-reel',
    label: 'Vidéo Démo',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    forReel: true,
  },
];