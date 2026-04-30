"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { Button, Input } from "@/components/ui";

export default function NewArtistPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", alias: "", bio: "", avatar: "", category: "MUSICIAN" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post("/api/admin/artists", form);
      if (res.code === 0) router.push("/admin/artists");
      else alert(res.message);
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-foreground mb-6">添加艺人</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="别名" value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })} />
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">分类</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="h-10 rounded-[var(--color-radius)] border border-border bg-card px-3 text-sm w-full">
            <option value="MUSICIAN">音乐人</option>
            <option value="DIRECTOR">导演</option>
            <option value="ACTOR">演员</option>
            <option value="WRITER">编剧</option>
          </select>
        </div>
        <Input label="头像 URL" value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} />
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">简介</label>
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} className="w-full rounded-[var(--color-radius)] border border-border bg-card px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <Button type="submit" disabled={saving}>{saving ? "保存中..." : "创建"}</Button>
      </form>
    </div>
  );
}
