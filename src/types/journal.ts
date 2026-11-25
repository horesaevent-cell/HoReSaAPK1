export type JournalCategory =
  | 'Pensées & Idées'
  | 'Rêves & Ambitions'
  | 'Objectifs'
  | 'Expériences quotidiennes';

export type JournalMood = 'Inspiré' | 'Serein' | 'Déterminé' | 'Réflexif';

export interface JournalEntry {
  id: string;
  ownerId: string;
  isPrivate: true;
  title: string;
  content: string;
  category: JournalCategory;
  mood: JournalMood;
  goalTarget?: string;
  progressPercent: number; // 0 à 100
  createdAt: string;
  updatedAt: string;
}

export interface JournalDraft {
  title: string;
  content: string;
  category: JournalCategory;
  mood: JournalMood;
  goalTarget?: string;
  progressPercent: number;
}