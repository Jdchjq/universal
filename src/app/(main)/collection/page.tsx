"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { api } from "@/services/api";
import { PaginatedData } from "@/types";
import { Pagination } from "@/components/ui";
import Link from "next/link";

interface LikeItem {
  id: string;
  resourceType: string;
  resourceId: string;
  createdAt: string;
}

export default function CollectionPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [items, setItems] = useState<LikeItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    if (!user) return;
    api.get<PaginatedData<LikeItem>>(`/api/likes?page=${page}&pageSize=${pageSize}`).then((res) => {
      if (res.code === 0) {
        setItems(res.data.list);
        setTotal(res.data.total);
      }
    }).catch(console.error);
  }, [user, page]);

  if (!user) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-muted-foreground">请先登录</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">我的收藏</h1>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">还没有收藏任何资源</p>
      ) : (
        <>
          <div className="space-y-2">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/${item.resourceType === "album" ? "music" : "film"}/${item.resourceId}`}
                className="block p-3 border border-border rounded-[var(--color-radius)] hover:bg-muted"
              >
                <span className="text-sm text-foreground">
                  {item.resourceType === "album" ? "🎵" : "🎬"} {item.resourceType} #{item.resourceId}
                </span>
                <span className="text-xs text-muted-foreground ml-3">
                  {new Date(item.createdAt).toLocaleDateString("zh-CN")}
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <Pagination page={page} totalPages={Math.ceil(total / pageSize)} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
