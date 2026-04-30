export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  avatar: string | null;
  role: string;
}

export interface AlbumDetail {
  id: string;
  title: string;
  cover: string | null;
  releaseDate: string | null;
  genre: string | null;
  description: string | null;
  trackCount: number;
  artist: {
    id: string;
    name: string;
    alias: string | null;
    bio: string | null;
    avatar: string | null;
  };
  tracks: {
    id: string;
    title: string;
    duration: number | null;
    trackNo: number;
  }[];
  likeCount?: number;
  watchCount?: number;
  isLiked?: boolean;
  isWatched?: boolean;
}

export interface FilmImageItem {
  id: string;
  type: string;
  url: string;
  width: number | null;
  height: number | null;
  language: string | null;
  isPrimary: boolean;
}

export interface FilmDetail {
  id: string;
  title: string;
  cover: string | null;
  releaseDate: string | null;
  genre: string | null;
  duration: number | null;
  country: string | null;
  description: string | null;
  type: string;
  cast: {
    id: string;
    artist: {
      id: string;
      name: string;
      avatar: string | null;
    };
    role: string;
    characterName: string | null;
    sortOrder: number;
  }[];
  images: FilmImageItem[];
  likeCount?: number;
  watchCount?: number;
  isLiked?: boolean;
  isWatched?: boolean;
}

export interface ArtistDetail {
  id: string;
  name: string;
  alias: string | null;
  bio: string | null;
  avatar: string | null;
  category: string;
  albums?: { id: string; title: string; cover: string | null; releaseDate: string | null }[];
  films?: { id: string; title: string; cover: string | null; releaseDate: string | null; role: string }[];
}

export interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    nickname: string;
    avatar: string | null;
  };
}
