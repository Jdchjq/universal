"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AlbumDetail } from "@/types";
import { api } from "@/services/api";
import { CommentSection } from "@/components/common";
import Link from "next/link";

export default function AlbumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [album, setAlbum] = useState<AlbumDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get<AlbumDetail>(`/api/music/${id}`).then((res) => {
      if (!cancelled && res.code === 0) setAlbum(res.data);
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const handleLike = async () => {
    if (!album) return;
    try {
      if (album.isLiked) {
        await api.delete(`/api/likes?resourceType=album&resourceId=${album.id}`);
        setAlbum({ ...album, isLiked: false, likeCount: (album.likeCount || 1) - 1 });
      } else {
        await api.post("/api/likes", { resourceType: "album", resourceId: album.id });
        setAlbum({ ...album, isLiked: true, likeCount: (album.likeCount || 0) + 1 });
      }
    } catch { /* ignore like toggle errors */ }
  };

  const handleWatch = async () => {
    if (!album) return;
    try {
      if (album.isWatched) {
        await api.delete(`/api/watches?resourceType=album&resourceId=${album.id}`);
        setAlbum({ ...album, isWatched: false });
      } else {
        await api.post("/api/watches", { resourceType: "album", resourceId: album.id });
        setAlbum({ ...album, isWatched: true });
      }
    } catch { /* ignore watch toggle errors */ }
  };

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-muted-foreground">加载中...</div>;
  if (!album) return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-muted-foreground">资源未找到</div>;

  const formatDuration = (s: number | null) => {
    if (!s) return "--:--";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row gap-8 mb-10">
        <div className="w-48 flex-shrink-0">
          <img src={album.cover || "/placeholder-cover.svg"} alt={album.title} className="w-full rounded-[var(--color-radius)] shadow-md" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground mb-2">{album.title}</h1>
          <Link href={`/artists/${album.artist.id}`} className="text-accent hover:text-foreground">
            {album.artist.name}
          </Link>
          {album.artist.alias && <span className="text-sm text-muted-foreground ml-2">({album.artist.alias})</span>}
          <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
            {album.genre && <span>{album.genre}</span>}
            {album.releaseDate && <span>{new Date(album.releaseDate).getFullYear()}</span>}
            <span>{album.trackCount} 首</span>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleLike} className={`px-4 py-1.5 text-sm rounded-[var(--color-radius)] border ${album.isLiked ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
              {album.isLiked ? "♥ 已喜爱" : "♡ 喜爱"}
            </button>
            <button onClick={handleWatch} className={`px-4 py-1.5 text-sm rounded-[var(--color-radius)] border ${album.isWatched ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
              {album.isWatched ? "✓ 已听过" : "标记已听"}
            </button>
          </div>
        </div>
      </div>

      {album.description && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-2">专辑介绍</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{album.description}</p>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-3">曲目列表</h2>
        <div className="border border-border rounded-[var(--color-radius)] overflow-hidden">
          {album.tracks.map((track) => (
            <div key={track.id} className="flex items-center px-4 py-2.5 border-b border-border last:border-0 hover:bg-muted">
              <span className="text-xs text-muted-foreground w-8">{track.trackNo}</span>
              <span className="flex-1 text-sm text-foreground">{track.title}</span>
              <span className="text-xs text-muted-foreground">{formatDuration(track.duration)}</span>
            </div>
          ))}
        </div>
      </div>

      {album.artist.bio && (
        <div className="mb-8 p-4 bg-muted rounded-[var(--color-radius)]">
          <h2 className="text-lg font-semibold text-foreground mb-2">关于 {album.artist.name}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{album.artist.bio}</p>
        </div>
      )}

      <CommentSection resourceType="album" resourceId={album.id} />
    </div>
  );
}
