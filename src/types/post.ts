export type PostCategory =
  | 'Tous'
  | 'Toutes'
  | 'Annonces'
  | 'Audio / X32'
  | 'Hôtellerie'
  | 'Hôtels'
  | 'Restauration'
  | 'Restaurants'
  | 'Salles'
  | 'Événementiel'
  | 'Événements'
  | 'Offres'
  | 'Musique & Scène'
  | 'Communauté'
  | string;

export interface PostAuthor {
  id?: string;
  name?: string;
  fullName?: string;
  handle?: string;
  role?: string;
  avatar?: string;
  avatarUri?: string;
  verified?: boolean;
}

export interface PostComment {
  id: string;
  authorName: string;
  authorHandle?: string;
  authorRole?: string;
  text?: string;
  content?: string;
  createdAt: string;
}

export interface Post {
  id: string;
  author?: PostAuthor;
  authorName?: string;
  authorRole?: string;
  category?: PostCategory;
  createdAt: string;
  title?: string;
  text?: string;
  content?: string;
  location?: string;
  price?: string | number;
  imageUrl?: string;
  images?: string[];
  videoUrl?: string;
  likes: number;
  likesCount?: number;
  comments?: PostComment[];
  commentsCount?: number;
  shares?: number;
  sharesCount?: number;
  bookmarksCount?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  fromFollowing?: boolean;
}

export type PostItem = Post;
export type HomeFeedPost = Post;

export interface StoryItem {
  id: string;
  userName?: string;
  authorName?: string;
  name?: string;
  role?: string;
  caption?: string;
  avatar?: string;
  avatarUri?: string;
  avatarUrl?: string;
  mediaUrl?: string;
  seen?: boolean;
}