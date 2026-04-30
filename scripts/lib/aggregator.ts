import type { TmdbMovieDetail, TmdbCredits } from "../../src/types/tmdb";

export interface AggregatedFilm {
  title: string;
  cover: string | null;
  releaseDate: string | null;
  genre: string | null;
  duration: number | null;
  country: string | null;
  description: string | null;
  type: string;
}

export interface AggregatedFilmography {
  title: string;
  year: string;
  role: string;
  mediaType: string; // movie | tv
}

export interface AggregatedArtist {
  name: string;
  englishName?: string;
  avatar: string | null;
  category: string;
  role: string;
  characterName: string | null;
  sortOrder: number;
  bio?: string;
  filmography?: AggregatedFilmography[];
}

export interface AggregatedData {
  film: AggregatedFilm;
  artists: AggregatedArtist[];
}

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

function imageUrl(path: string | null | undefined): string | null {
  return path ? `${TMDB_IMAGE_BASE}${path}` : null;
}

export function aggregateTmdbData(detail: TmdbMovieDetail, credits: TmdbCredits): AggregatedData {
  const film: AggregatedFilm = {
    title: detail.title || detail.original_title,
    cover: imageUrl(detail.poster_path),
    releaseDate: detail.release_date || null,
    genre: detail.genres?.map((g) => g.name).join("、") || null,
    duration: detail.runtime || null,
    country: detail.production_countries?.map((c) => c.name).join("、") || null,
    description: detail.overview || null,
    type: "MOVIE",
  };

  const artists: AggregatedArtist[] = [];
  const seen = new Set<string>();
  let sortOrder = 0;

  for (const person of credits.crew) {
    if (person.job === "Director") {
      const key = `${person.name}|DIRECTOR`;
      if (!seen.has(key)) {
        seen.add(key);
        artists.push({
          name: person.name,
          avatar: imageUrl(person.profile_path),
          category: "DIRECTOR",
          role: "DIRECTOR",
          characterName: null,
          sortOrder: sortOrder++,
        });
      }
    }
  }

  for (const person of credits.cast.slice(0, 10)) {
    const key = `${person.name}|ACTOR`;
    if (!seen.has(key)) {
      seen.add(key);
      artists.push({
        name: person.name,
        avatar: imageUrl(person.profile_path),
        category: "ACTOR",
        role: "ACTOR",
        characterName: person.character || null,
        sortOrder: sortOrder++,
      });
    }
  }

  return { film, artists };
}
