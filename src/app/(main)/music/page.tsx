"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardImage, CardContent, Input, Pagination } from "@/components/ui";
import { api } from "@/services/api";
import { PaginatedData } from "@/types";

interface AlbumItem {
  id: string;
  title: string;
  cover: string | null;
  releaseDate: string | null;
  genre: string | null;
  artist: { id: string; name: string };
}

export default function MusicPage() {
  const [data, setData] = useState<PaginatedData<AlbumItem> | null>(null);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", "20");
    if (keyword) params.set("keyword", keyword);
    api
      .get<PaginatedData<AlbumItem>>(`/api/music?${params}`)
      .then((res) => { if (!cancelled && res.code === 0) setData(res.data); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, keyword]);

  const formatYear = (d: string | null) =>
    d ? new Date(d).getFullYear() : "未知";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">音乐</h1>
      <div className="mb-6 max-w-sm">
        <Input
          placeholder="搜索专辑或艺术家..."
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
        />
      </div>
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">加载中...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {(data?.list || []).map((album) => (
              <Link key={album.id} href={`/music/${album.id}`}>
                <Card hover className="h-full">
                  <CardImage src={album.cover || "/placeholder-cover.svg"} alt={album.title} />
                  <CardContent>
                    <p className="text-sm font-medium text-foreground truncate">{album.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {album.artist.name} · {formatYear(album.releaseDate)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          {data && data.total > 0 && (
            <div className="mt-8 flex justify-center">
              <Pagination page={page} totalPages={Math.ceil(data.total / data.pageSize)} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
