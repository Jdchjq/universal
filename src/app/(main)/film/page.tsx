"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardImage, CardContent, Input, Pagination } from "@/components/ui";
import { api } from "@/services/api";
import { PaginatedData } from "@/types";

interface FilmItem {
  id: string;
  title: string;
  cover: string | null;
  releaseDate: string | null;
  genre: string | null;
  type: string;
}

export default function FilmPage() {
  const [data, setData] = useState<PaginatedData<FilmItem> | null>(null);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [filmType, setFilmType] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", "20");
    if (keyword) params.set("keyword", keyword);
    if (filmType) params.set("type", filmType);
    api
      .get<PaginatedData<FilmItem>>(`/api/film?${params}`)
      .then((res) => { if (!cancelled && res.code === 0) setData(res.data); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, keyword, filmType]);

  const formatYear = (d: string | null) =>
    d ? new Date(d).getFullYear() : "未知";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">影视</h1>
      <div className="flex gap-3 mb-6">
        <div className="max-w-sm flex-1">
          <Input
            placeholder="搜索影视或演员..."
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={filmType}
          onChange={(e) => { setFilmType(e.target.value); setPage(1); }}
          className="h-10 rounded-[var(--color-radius)] border border-border bg-card px-3 text-sm text-foreground"
        >
          <option value="">全部</option>
          <option value="MOVIE">电影</option>
          <option value="SERIES">剧集</option>
        </select>
      </div>
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">加载中...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {(data?.list || []).map((film) => (
              <Link key={film.id} href={`/film/${film.id}`}>
                <Card hover className="h-full">
                  <CardImage src={film.cover || "/placeholder-cover.svg"} alt={film.title} />
                  <CardContent>
                    <p className="text-sm font-medium text-foreground truncate">{film.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {film.type === "MOVIE" ? "电影" : "剧集"} · {formatYear(film.releaseDate)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          {data && (
            <div className="mt-8 flex justify-center">
              <Pagination page={page} totalPages={Math.ceil(data.total / data.pageSize)} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
