"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Button } from "@/components/ui";
import Link from "next/link";

interface Film {
  id: string;
  title: string;
  type: string;
  genre: string | null;
}

export default function AdminFilm() {
  const [films, setFilms] = useState<Film[]>([]);

  useEffect(() => {
    api.get<Film[]>("/api/admin/film").then((res) => {
      if (res.code === 0) setFilms(res.data);
    }).catch(console.error);
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`确认删除 ${title}？`)) return;
    try {
      const res = await api.delete(`/api/admin/film/${id}`);
      if (res.code === 0) setFilms(films.filter((f) => f.id !== id));
      else alert(res.message);
    } catch (err) {
      alert(err instanceof Error ? err.message : "删除失败");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">影视管理</h1>
        <Link href="/admin/film/new">
          <Button>添加影视</Button>
        </Link>
      </div>
      <div className="border border-border rounded-[var(--color-radius)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-medium">标题</th>
              <th className="text-left px-4 py-3 font-medium">类型</th>
              <th className="text-left px-4 py-3 font-medium">风格</th>
              <th className="text-right px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {films.map((film) => (
              <tr key={film.id} className="border-t border-border">
                <td className="px-4 py-3">{film.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{film.type === "MOVIE" ? "电影" : "剧集"}</td>
                <td className="px-4 py-3 text-muted-foreground">{film.genre || "-"}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/film/${film.id}`} className="text-sm text-accent hover:text-foreground mr-3">
                    编辑
                  </Link>
                  <button onClick={() => handleDelete(film.id, film.title)} className="text-sm text-destructive hover:underline">
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
