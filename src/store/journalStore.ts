import { useEffect, useState } from 'react';
import { JournalDraft, JournalEntry } from '../types/journal';

const ACTIVE_JOURNAL_USER_ID = 'horesa-current-user';
const STORAGE_KEY = `@horesa_private_journal_${ACTIVE_JOURNAL_USER_ID}`;

const INITIAL_PRIVATE_ENTRIES: JournalEntry[] = [
  {
    id: 'jrn-1',
    ownerId: ACTIVE_JOURNAL_USER_ID,
    isPrivate: true,
    title: 'Développer une expérience d’accueil chaleureuse',
    content:
      'Idée notée après échange : structurer un parcours client fluide entre réservation, accueil sur place et suivi après séjour.',
    category: 'Rêves & Ambitions',
    mood: 'Inspiré',
    goalTarget: 'Lancer le prototype d’accueil HoReSa ce trimestre',
    progressPercent: 45,
    createdAt: 'Aujourd’hui • 09:15',
    updatedAt: 'Aujourd’hui • 09:15',
  },
  {
    id: 'jrn-2',
    ownerId: ACTIVE_JOURNAL_USER_ID,
    isPrivate: true,
    title: 'Bilan de la journée terrain',
    content:
      'Journée productive : observation des besoins des acteurs locaux, prise de notes rapides et priorisation des prochaines étapes.',
    category: 'Expériences quotidiennes',
    mood: 'Réflexif',
    goalTarget: 'Maintenir 1 note quotidienne pendant 30 jours',
    progressPercent: 70,
    createdAt: 'Hier • 19:40',
    updatedAt: 'Hier • 19:40',
  },
  {
    id: 'jrn-3',
    ownerId: ACTIVE_JOURNAL_USER_ID,
    isPrivate: true,
    title: 'Clarifier mes objectifs mensuels',
    content:
      'Découper mes grandes ambitions en petites actions hebdomadaires mesurables pour garder un rythme régulier.',
    category: 'Objectifs',
    mood: 'Déterminé',
    goalTarget: 'Valider 3 étapes clés ce mois-ci',
    progressPercent: 60,
    createdAt: 'Il y a 2 jours',
    updatedAt: 'Il y a 2 jours',
  },
];

let memoryEntries: JournalEntry[] = [...INITIAL_PRIVATE_ENTRIES];
const listeners = new Set<(entries: JournalEntry[]) => void>();

let AsyncStorageRef: any = null;
try {
  const mod = require('@react-native-async-storage/async-storage');
  AsyncStorageRef = mod?.default ?? mod;
} catch {
  AsyncStorageRef = null;
}

function notify() {
  const snapshot = memoryEntries
    .filter((item) => item.ownerId === ACTIVE_JOURNAL_USER_ID && item.isPrivate)
    .map((item) => ({ ...item }));
  listeners.forEach((fn) => fn(snapshot));
}

async function persistEntries() {
  if (!AsyncStorageRef?.setItem) return;
  try {
    const privateOnly = memoryEntries.filter(
      (item) => item.ownerId === ACTIVE_JOURNAL_USER_ID && item.isPrivate
    );
    await AsyncStorageRef.setItem(STORAGE_KEY, JSON.stringify(privateOnly));
  } catch {
    // Repli silencieux sur la mémoire en cas d'indisponibilité du stockage
  }
}

async function hydrateEntries() {
  if (!AsyncStorageRef?.getItem) return;
  try {
    const raw = await AsyncStorageRef.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      memoryEntries = parsed.filter(
        (item: JournalEntry) =>
          item && item.ownerId === ACTIVE_JOURNAL_USER_ID && item.isPrivate
      );
      notify();
    }
  } catch {
    // Conserver les données initiales en mémoire
  }
}

let hydrated = false;
function ensureHydrated() {
  if (hydrated) return;
  hydrated = true;
  hydrateEntries();
}

export const journalStore = {
  getPrivateEntries(): JournalEntry[] {
    ensureHydrated();
    return memoryEntries
      .filter(
        (item) => item.ownerId === ACTIVE_JOURNAL_USER_ID && item.isPrivate
      )
      .map((item) => ({ ...item }));
  },

  addEntry(draft: JournalDraft): JournalEntry {
    ensureHydrated();
    const clampedProgress = Math.max(
      0,
      Math.min(100, Math.round(draft.progressPercent))
    );
    const created: JournalEntry = {
      id: `jrn-${Date.now()}`,
      ownerId: ACTIVE_JOURNAL_USER_ID,
      isPrivate: true,
      title: draft.title.trim() || 'Entrée personnelle sans titre',
      content: draft.content.trim(),
      category: draft.category,
      mood: draft.mood,
      goalTarget: draft.goalTarget?.trim() || undefined,
      progressPercent: clampedProgress,
      createdAt: 'À l’instant',
      updatedAt: 'À l’instant',
    };
    memoryEntries = [created, ...memoryEntries];
    notify();
    persistEntries();
    return created;
  },

  updateProgress(entryId: string, nextProgress: number): void {
    const clamped = Math.max(0, Math.min(100, Math.round(nextProgress)));
    memoryEntries = memoryEntries.map((item) => {
      if (item.id !== entryId || item.ownerId !== ACTIVE_JOURNAL_USER_ID) {
        return item;
      }
      return {
        ...item,
        progressPercent: clamped,
        updatedAt: 'Mis à jour à l’instant',
      };
    });
    notify();
    persistEntries();
  },

  deleteEntry(entryId: string): void {
    memoryEntries = memoryEntries.filter(
      (item) => !(item.id === entryId && item.ownerId === ACTIVE_JOURNAL_USER_ID)
    );
    notify();
    persistEntries();
  },

  subscribe(listener: (entries: JournalEntry[]) => void): () => void {
    ensureHydrated();
    listeners.add(listener);
    listener(journalStore.getPrivateEntries());
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useJournalStore() {
  const [entries, setEntries] = useState<JournalEntry[]>(() =>
    journalStore.getPrivateEntries()
  );

  useEffect(() => {
    return journalStore.subscribe(setEntries);
  }, []);

  return {
    entries,
    addEntry: journalStore.addEntry,
    updateProgress: journalStore.updateProgress,
    deleteEntry: journalStore.deleteEntry,
  };
}