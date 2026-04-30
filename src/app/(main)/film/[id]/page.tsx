"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FilmDetail } from "@/types";
import { api } from "@/services/api";
import { CommentSection } from "@/components/common";
import Link from "next/link";

const roleLabel: Record<string, string> = {
  DIRECTOR: "导演",
  Director: "导演",
  ACTOR: "演员",
  WRITER: "编剧",
  Writer: "编剧",
  Screenplay: "编剧",
  Producer: "制片人",
  "Executive Producer": "执行制片人",
  Cinematographer: "摄影",
  "Director of Photography": "摄影指导",
  Composer: "配乐",
  "Original Music Composer": "原创配乐",
  Editor: "剪辑",
  "Production Designer": "美术指导",
  "Art Director": "艺术指导",
  "Costume Designer": "服装设计",
  "Makeup Artist": "化妆",
  "Visual Effects": "视觉特效",
};

export default function FilmDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [film, setFilm] = useState<FilmDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.get<FilmDetail>(`/api/film/${id}`).then((res) => {
      if (!cancelled && res.code === 0) {
        setFilm(res.data);
        setActiveImage(res.data.cover || null);
      }
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const handleLike = async () => {
    if (!film) return;
    try {
      if (film.isLiked) {
        await api.delete(`/api/likes?resourceType=film&resourceId=${film.id}`);
        setFilm({ ...film, isLiked: false, likeCount: (film.likeCount || 1) - 1 });
      } else {
        await api.post("/api/likes", { resourceType: "film", resourceId: film.id });
        setFilm({ ...film, isLiked: true, likeCount: (film.likeCount || 0) + 1 });
      }
    } catch { /* ignore like toggle errors */ }
  };

  const handleWatch = async () => {
    if (!film) return;
    try {
      if (film.isWatched) {
        await api.delete(`/api/watches?resourceType=film&resourceId=${film.id}`);
        setFilm({ ...film, isWatched: false });
      } else {
        await api.post("/api/watches", { resourceType: "film", resourceId: film.id });
        setFilm({ ...film, isWatched: true });
      }
    } catch { /* ignore watch toggle errors */ }
  };

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-muted-foreground">加载中...</div>;
  if (!film) return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-muted-foreground">资源未找到</div>;

  const posters = (film.images || []).filter((img) => img.type === "POSTER");
  const hasGallery = posters.length > 1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row gap-8 mb-10">
        <div className="w-48 flex-shrink-0">
          <img
            src={activeImage || film.cover || "/placeholder-cover.svg"}
            alt={film.title}
            className="w-full rounded-[var(--color-radius)] shadow-md"
          />
          {hasGallery && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {posters.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img.url)}
                  className={`flex-shrink-0 w-14 h-20 rounded overflow-hidden border-2 transition-colors ${
                    activeImage === img.url
                      ? "border-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <img
                    src={img.url.replace("/w780", "/w92")}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground mb-2">{film.title}</h1>
          <div className="flex gap-3 text-sm text-muted-foreground mb-2">
            <span>{film.type === "MOVIE" ? "电影" : "剧集"}</span>
            {film.genre && <span>{film.genre}</span>}
            {film.releaseDate && <span>{new Date(film.releaseDate).getFullYear()}</span>}
            {film.duration && <span>{film.duration} 分钟</span>}
            {film.country && <span>{film.country}</span>}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleLike} className={`px-4 py-1.5 text-sm rounded-[var(--color-radius)] border ${film.isLiked ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
              {film.isLiked ? "♥ 已喜爱" : "♡ 喜爱"}
            </button>
            <button onClick={handleWatch} className={`px-4 py-1.5 text-sm rounded-[var(--color-radius)] border ${film.isWatched ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
              {film.isWatched ? "✓ 已观看" : "标记已看"}
            </button>
          </div>
        </div>
      </div>

      {film.description && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-2">简介</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{film.description}</p>
        </div>
      )}

      {(function () {
        const creators = film.cast.filter((c) => c.role !== "ACTOR");
        const actors = film.cast.filter((c) => c.role === "ACTOR");

        return (
          <>
            {creators.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-foreground mb-3">主创</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {creators.map((c) => (
                    <Link key={c.id} href={`/artists/${c.artist.id}`} className="flex items-center gap-3 p-3 border border-border rounded-[var(--color-radius)] hover:bg-muted transition-colors">
                      <img src={c.artist.avatar || "/placeholder-cover.svg"} alt={c.artist.name} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.artist.name}</p>
                        <p className="text-xs text-muted-foreground">{roleLabel[c.role] || c.role}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {actors.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-foreground mb-3">演员</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {actors.map((c) => (
                    <Link key={c.id} href={`/artists/${c.artist.id}`} className="flex items-center gap-3 p-3 border border-border rounded-[var(--color-radius)] hover:bg-muted transition-colors">
                      <img src={c.artist.avatar || "/placeholder-cover.svg"} alt={c.artist.name} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.artist.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {roleLabel[c.role] || c.role}
                          {c.characterName && ` · ${c.characterName}`}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      })()}

      <CommentSection resourceType="film" resourceId={film.id} />
    </div>
  );
}
