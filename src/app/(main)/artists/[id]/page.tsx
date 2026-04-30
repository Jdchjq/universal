"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArtistDetail } from "@/types";
import { api } from "@/services/api";
import Link from "next/link";
import { Card, CardImage, CardContent } from "@/components/ui";

const categoryLabel: Record<string, string> = {
  MUSICIAN: "音乐人",
  DIRECTOR: "导演",
  ACTOR: "演员",
  WRITER: "编剧",
};

export default function ArtistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get<ArtistDetail>(`/api/artists/${id}`).then((res) => {
      if (!cancelled && res.code === 0) setArtist(res.data);
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-muted-foreground">加载中...</div>;
  if (!artist) return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-muted-foreground">资源未找到</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-start gap-6 mb-10">
        <img src={artist.avatar || "/placeholder-cover.svg"} alt={artist.name} className="w-24 h-24 rounded-full object-cover" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">{artist.name}</h1>
          {artist.alias && <p className="text-sm text-muted-foreground">{artist.alias}</p>}
          <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
            {categoryLabel[artist.category] || artist.category}
          </span>
        </div>
      </div>

      {artist.bio && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-2">简介</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{artist.bio}</p>
        </div>
      )}

      {(artist.albums?.length ?? 0) > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">音乐作品</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {artist.albums?.map((album) => (
              <Link key={album.id} href={`/music/${album.id}`}>
                <Card hover className="h-full">
                  <CardImage src={album.cover || "/placeholder-cover.svg"} alt={album.title} />
                  <CardContent>
                    <p className="text-sm font-medium text-foreground truncate">{album.title}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {(artist.films?.length ?? 0) > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">影视作品</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {artist.films?.map((film) => (
              <Link key={film.id} href={`/film/${film.id}`}>
                <Card hover className="h-full">
                  <CardImage src={film.cover || "/placeholder-cover.svg"} alt={film.title} />
                  <CardContent>
                    <p className="text-sm font-medium text-foreground truncate">{film.title}</p>
                    <p className="text-xs text-muted-foreground">{film.role ? (roleLabelFilm(film.role)) : ""}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function roleLabelFilm(role: string): string {
  const labels: Record<string, string> = { DIRECTOR: "导演", ACTOR: "演员", WRITER: "编剧" };
  return labels[role] || role;
}
