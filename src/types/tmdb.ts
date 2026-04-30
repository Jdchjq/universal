export interface TmdbMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime: number | null;
  production_countries: { iso_3166_1: string; name: string }[];
  vote_average: number;
  popularity: number;
}

export interface TmdbSearchResult {
  page: number;
  results: TmdbMovie[];
  total_results: number;
}

export interface TmdbCredit {
  id: number;
  name: string;
  original_name: string;
  profile_path: string | null;
  character?: string;
  job?: string;
  known_for_department: string;
  popularity: number;
}

export interface TmdbCredits {
  id: number;
  cast: TmdbCredit[];
  crew: TmdbCredit[];
}

export interface TmdbImage {
  file_path: string;
  width: number;
  height: number;
  iso_639_1: string | null;
  vote_average: number;
  vote_count: number;
  aspect_ratio: number;
}

export interface TmdbImagesResponse {
  id: number;
  posters: TmdbImage[];
  backdrops: TmdbImage[];
}

export interface TmdbMovieDetail extends TmdbMovie {
  genres: { id: number; name: string }[];
  runtime: number | null;
  production_countries: { iso_3166_1: string; name: string }[];
}
