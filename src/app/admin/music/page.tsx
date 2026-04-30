"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Button } from "@/components/ui";
import Link from "next/link";

interface Album {
  id: string;
  title: string;
  artist: { name: string };
  genre: string | null;
}

export default function AdminMusic() {
  const [albums, setAlbums] = useState<Album[]>([]);

  useEffect(() => {
    api.get<Album[]>("/api/admin/music").then((res) => {
      if (res.code === 0) setAlbums(res.data);
    }).catch(console.error);
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`确认删除 ${title}？`)) return;
    try {
      const res = await api.delete(`/api/admin/music/${id}`);
      if (res.code === 0) setAlbums(albums.filter((a) => a.id !== id));
      else alert(res.message);
    } catch (err) {
      alert(err instanceof Error ? err.message : "删除失败");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">音乐管理</h1>
        <Link href="/admin/music/new">
          <Button>添加专辑</Button>
        </Link>
      </div>
      <div className="border border-border rounded-[var(--color-radius)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-medium">标题</th>
              <th className="text-left px-4 py-3 font-medium">艺人</th>
              <th className="text-left px-4 py-3 font-medium">风格</th>
              <th className="text-right px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {albums.map((album) => (
              <tr key={album.id} className="border-t border-border">
                <td className="px-4 py-3">{album.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{album.artist?.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{album.genre || "-"}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/music/${album.id}`} className="text-sm text-accent hover:text-foreground mr-3">
                    编辑
                  </Link>
                  <button onClick={() => handleDelete(album.id, album.title)} className="text-sm text-destructive hover:underline">
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
