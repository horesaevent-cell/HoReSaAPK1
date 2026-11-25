export type ReelFocusTag = 'Talents' | 'Ambitions' | 'Expériences';

export type ReelDiscoveryFilter =
  | 'forYou'
  | 'following'
  | 'Talents'
  | 'Ambitions'
  | 'Expériences';

export interface ReelCommentItem {
  id: string;
  author: string;
  text: string;
  time: string;
}

export interface ReelEntry {
  id: string;
  authorName: string;
  handle: string;
  role: string;
  city: string;
  verified?: boolean;
  focusTag: ReelFocusTag;
  ambitionLabel: string;
  caption: string;
  audioTitle: string;
  mediaUrl: string;
  videoUrl: string;
  streamPlaybackUrl?: string;
  durationLabel: string;
  likes: number;
  comments: ReelCommentItem[];
  shares: number;
  followers: string;
  followingCount: string;
  postsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  isFollowing: boolean;
  isMuted?: boolean;
  isPaused?: boolean;
}

export interface ReelComment {
  id: string;
  userName?: string;
  authorName?: string;
  authorHandle?: string;
  authorRole?: string;
  text: string;
  createdAt: string;
}

export interface ReelItemData {
  id: string;
  userName?: string;
  authorName?: string;
  authorRole?: string;
  userHandle?: string;
  authorHandle?: string;
  handle?: string;
  userAvatar?: string;
  avatarUri?: string;
  avatarUrl?: string;
  authorAvatar?: string;
  role?: string;
  city?: string;
  category?: string;
  verified?: boolean;
  caption: string;
  location?: string;
  tags?: string[];
  videoUrl?: string;
  streamPlaybackUrl?: string;
  posterUrl?: string;
  thumbnailUrl?: string;
  mediaUrl?: string;
  duration?: string;
  durationLabel?: string;
  audioTitle?: string;
  soundTitle?: string;
  likes: number;
  likesCount?: number;
  comments: ReelComment[] | number;
  commentsCount?: number;
  shares: number;
  sharesCount?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  isSaved?: boolean;
  isFollowing?: boolean;
  isMuted?: boolean;
  isPaused?: boolean;
  createdAt?: string;
}

export type Reel = ReelItemData;