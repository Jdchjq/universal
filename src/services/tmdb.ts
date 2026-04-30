import type { TmdbSearchResult, TmdbMovieDetail, TmdbCredits, TmdbImagesResponse, TmdbImage } from "@/types/tmdb";

const BASE_URL = process.env.TMDB_API_BASE_URL || "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY || "";

async function tmdbGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("language", "zh-CN");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "UniversalResourceHub/0.1",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`TMDB API 请求失败(${res.status}): ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function searchMovies(query: string): Promise<TmdbSearchResult> {
  return tmdbGet<TmdbSearchResult>("/search/movie", { query });
}

export async function getMovieDetail(id: number): Promise<TmdbMovieDetail> {
  return tmdbGet<TmdbMovieDetail>(`/movie/${id}`);
}

export async function getMovieCredits(id: number): Promise<TmdbCredits> {
  return tmdbGet<TmdbCredits>(`/movie/${id}/credits`);
}

export async function getMovieImages(id: number): Promise<TmdbImagesResponse> {
  return tmdbGet<TmdbImagesResponse>(`/movie/${id}/images`);
}

export function buildImageUrl(filePath: string, size: string = "w780"): string {
  return `https://image.tmdb.org/t/p/${size}${filePath}`;
}

export function pickPrimaryPoster(posters: TmdbImage[]): TmdbImage | null {
  const valid = posters.filter((p) => p.file_path);
  if (valid.length === 0) return null;

  const groups = new Map<string, TmdbImage[]>();
  for (const p of valid) {
    const key = p.iso_639_1 ?? "null";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  for (const [, group] of groups) {
    group.sort((a, b) => b.vote_average - a.vote_average);
  }

  const priority = ["zh", "null", "en"];
  for (const lang of priority) {
    const group = groups.get(lang);
    if (group && group.length > 0) return group[0];
  }

  for (const [, group] of groups) {
    if (group.length > 0) return group[0];
  }

  return null;
}
