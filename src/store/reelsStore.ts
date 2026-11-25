import { useEffect, useState } from 'react';
import { INITIAL_REELS_DATA } from '../services/reelsService';
import { ReelCommentItem, ReelEntry } from '../types/reels';

export type { ReelCommentItem, ReelEntry };

const LIVE_REEL_INTERACTIONS: {
  reelId: string;
  author: string;
  comment: string;
  likeBoost: number;
}[] = [
  {
    reelId: 'reel-1',
    author: 'Clarisse Mukwege',
    comment: 'Superbe suite, je viens de réserver pour le week-end !',
    likeBoost: 3,
  },
  {
    reelId: 'reel-2',
    author: 'Jean-Luc Birindwa',
    comment: 'Les grillades du soir ont l’air incroyables.',
    likeBoost: 5,
  },
  {
    reelId: 'reel-3',
    author: 'Miriam Kavira',
    comment: 'Parfait pour organiser notre conférence du mois prochain.',
    likeBoost: 2,
  },
  {
    reelId: 'reel-4',
    author: 'Olivier Cishugi',
    comment: 'Ambiance lounge très chaleureuse à Goma.',
    likeBoost: 4,
  },
];

let currentReels: ReelEntry[] = [...INITIAL_REELS_DATA];
let liveActivityEnabled = true;
let interactionCursor = 0;
const listeners = new Set<(items: ReelEntry[]) => void>();

function notify() {
  const snapshot = [...currentReels];
  listeners.forEach((fn) => fn(snapshot));
}

function triggerSimulatedInteraction() {
  if (!liveActivityEnabled || currentReels.length === 0) return;

  const step =
    LIVE_REEL_INTERACTIONS[interactionCursor % LIVE_REEL_INTERACTIONS.length];
  interactionCursor += 1;

  currentReels = currentReels.map((reel) => {
    const matchesTarget =
      reel.id === step.reelId ||
      (interactionCursor % LIVE_REEL_INTERACTIONS.length === 0 &&
        reel.id === currentReels[0].id);

    if (!matchesTarget) return reel;

    const newComment: ReelCommentItem = {
      id: `live-rc-${Date.now()}-${interactionCursor}`,
      author: step.author,
      text: step.comment,
      time: 'À l’instant',
    };

    return {
      ...reel,
      likes: reel.likes + step.likeBoost,
      shares: reel.shares + 1,
      comments: [...reel.comments.slice(-14), newComment],
    };
  });

  notify();
}

let intervalStarted = false;
function ensureLiveTicker() {
  if (intervalStarted) return;
  intervalStarted = true;
  setInterval(() => {
    triggerSimulatedInteraction();
  }, 6500);
}

export const reelsStore = {
  getReels(): ReelEntry[] {
    ensureLiveTicker();
    return [...currentReels];
  },

  setReels(updater: ReelEntry[] | ((prev: ReelEntry[]) => ReelEntry[])) {
    currentReels =
      typeof updater === 'function' ? updater(currentReels) : updater;
    notify();
  },

  publishReel(
    newReel: Omit<ReelEntry, 'id' | 'focusTag' | 'ambitionLabel'> &
      Partial<Pick<ReelEntry, 'focusTag' | 'ambitionLabel'>>
  ): ReelEntry {
    const created: ReelEntry = {
      focusTag: 'Ambitions',
      ambitionLabel: `Partager l'inspiration ${newReel.role}`,
      isMuted: false,
      ...newReel,
      id: `reel-${Date.now()}`,
    };
    currentReels = [created, ...currentReels];
    notify();
    return created;
  },

  setLiveActivityEnabled(enabled: boolean) {
    liveActivityEnabled = enabled;
  },

  subscribe(listener: (items: ReelEntry[]) => void): () => void {
    ensureLiveTicker();
    listeners.add(listener);
    listener([...currentReels]);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useReelsStore() {
  const [items, setItems] = useState<ReelEntry[]>(() => reelsStore.getReels());

  useEffect(() => {
    return reelsStore.subscribe(setItems);
  }, []);

  return {
    reels: items,
    setReels: reelsStore.setReels,
    publishReel: reelsStore.publishReel,
    setLiveActivityEnabled: reelsStore.setLiveActivityEnabled,
  };
}