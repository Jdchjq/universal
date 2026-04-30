"use client";

import { useState } from "react";
import { api } from "@/services/api";
import { Button } from "@/components/ui";

export default function AdminImport() {
  const [type, setType] = useState("album");
  const [jsonText, setJsonText] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const handleImport = async () => {
    try {
      const items = JSON.parse(jsonText);
      if (!Array.isArray(items)) {
        setResult("数据格式错误：需要 JSON 数组");
        return;
      }
      const res = await api.post<{ successCount: number; failCount: number; errors: string[] }>(
        "/api/admin/import",
        { type, items }
      );
      if (res.code === 0) {
        setResult(`导入完成：成功 ${res.data.successCount} 条，失败 ${res.data.failCount} 条。${res.data.errors.length > 0 ? `错误详情: ${res.data.errors.join("; ")}` : ""}`);
      } else {
        setResult(res.message);
      }
    } catch (err) {
      setResult(err instanceof Error ? err.message : "导入失败");
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">批量导入</h1>
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">导入类型</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="h-10 rounded-[var(--color-radius)] border border-border bg-card px-3 text-sm text-foreground"
        >
          <option value="album">专辑</option>
          <option value="film">影视</option>
          <option value="artist">艺人</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">JSON 数据（数组格式）</label>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={12}
          className="w-full rounded-[var(--color-radius)] border border-border bg-card px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          placeholder='[{"title": "示例专辑", "artistId": "...", "genre": "Rock"}]'
        />
      </div>
      <Button onClick={handleImport} disabled={!jsonText.trim()}>
        开始导入
      </Button>
      {result && (
        <div className="mt-4 p-3 rounded-[var(--color-radius)] bg-muted text-sm text-foreground">
          {result}
        </div>
      )}
    </div>
  );
}
