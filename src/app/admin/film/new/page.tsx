"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { Button, Input } from "@/components/ui";

export default function NewFilmPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", cover: "", releaseDate: "", genre: "", duration: "", country: "", description: "", type: "MOVIE", tmdbId: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post("/api/admin/film", {
        ...form,
        duration: form.duration ? parseInt(form.duration) : null,
      });
      if (res.code === 0) router.push("/admin/film");
      else alert(res.message);
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-foreground mb-6">添加影视</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="标题" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">类型</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="h-10 rounded-[var(--color-radius)] border border-border bg-card px-3 text-sm w-full">
            <option value="MOVIE">电影</option>
            <option value="SERIES">剧集</option>
          </select>
        </div>
        <Input label="TMDB ID（可选，自动拉取海报）" value={form.tmdbId} onChange={(e) => setForm({ ...form, tmdbId: e.target.value })} placeholder="例如 550" />
        <Input label="封面 URL" value={form.cover} onChange={(e) => setForm({ ...form, cover: e.target.value })} />
        <Input label="发行日期" type="date" value={form.releaseDate} onChange={(e) => setForm({ ...form, releaseDate: e.target.value })} />
        <Input label="风格" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} />
        <Input label="时长（分钟）" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
        <Input label="国家/地区" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">简介</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full rounded-[var(--color-radius)] border border-border bg-card px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <Button type="submit" disabled={saving}>{saving ? "保存中..." : "创建"}</Button>
      </form>
    </div>
  );
}
