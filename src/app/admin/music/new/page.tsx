"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { Button, Input } from "@/components/ui";

interface ArtistOption { id: string; name: string; }

export default function NewMusicPage() {
  const router = useRouter();
  const [artists, setArtists] = useState<ArtistOption[]>([]);
  const [form, setForm] = useState({ title: "", artistId: "", cover: "", releaseDate: "", genre: "", description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<ArtistOption[]>("/api/admin/artists").then((res) => {
      if (res.code === 0) setArtists(res.data);
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post("/api/admin/music", form);
      if (res.code === 0) router.push("/admin/music");
      else alert(res.message);
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-foreground mb-6">添加专辑</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="标题" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">艺人</label>
          <select value={form.artistId} onChange={(e) => setForm({ ...form, artistId: e.target.value })} required className="h-10 rounded-[var(--color-radius)] border border-border bg-card px-3 text-sm w-full">
            <option value="">选择艺人</option>
            {artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <Input label="封面 URL" value={form.cover} onChange={(e) => setForm({ ...form, cover: e.target.value })} />
        <Input label="发行日期" type="date" value={form.releaseDate} onChange={(e) => setForm({ ...form, releaseDate: e.target.value })} />
        <Input label="风格" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} />
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">简介</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full rounded-[var(--color-radius)] border border-border bg-card px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <Button type="submit" disabled={saving}>{saving ? "保存中..." : "创建"}</Button>
      </form>
    </div>
  );
}
