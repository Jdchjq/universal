"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Button } from "@/components/ui";
import Link from "next/link";

interface Artist {
  id: string;
  name: string;
  category: string;
  _count: { albums: number; filmCasts: number };
}

export default function AdminArtists() {
  const [artists, setArtists] = useState<Artist[]>([]);

  useEffect(() => {
    api.get<Artist[]>("/api/admin/artists").then((res) => {
      if (res.code === 0) setArtists(res.data);
    }).catch(console.error);
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确认删除 ${name}？`)) return;
    try {
      const res = await api.delete(`/api/admin/artists/${id}`);
      if (res.code === 0) setArtists(artists.filter((a) => a.id !== id));
      else alert(res.message);
    } catch (err) {
      alert(err instanceof Error ? err.message : "删除失败");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">艺人管理</h1>
        <Link href="/admin/artists/new">
          <Button>添加艺人</Button>
        </Link>
      </div>
      <div className="border border-border rounded-[var(--color-radius)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-medium">名称</th>
              <th className="text-left px-4 py-3 font-medium">分类</th>
              <th className="text-left px-4 py-3 font-medium">作品数</th>
              <th className="text-right px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {artists.map((artist) => (
              <tr key={artist.id} className="border-t border-border">
                <td className="px-4 py-3">{artist.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{artist.category}</td>
                <td className="px-4 py-3 text-muted-foreground">{artist._count.albums + artist._count.filmCasts}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/artists/${artist.id}`} className="text-sm text-accent hover:text-foreground mr-3">
                    编辑
                  </Link>
                  <button onClick={() => handleDelete(artist.id, artist.name)} className="text-sm text-destructive hover:underline">
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
