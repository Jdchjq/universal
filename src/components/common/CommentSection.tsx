"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { Button, Pagination } from "@/components/ui";
import { api } from "@/services/api";
import { CommentItem, PaginatedData } from "@/types";
import { RootState } from "@/store";

interface Props {
  resourceType: string;
  resourceId: string;
}

export function CommentSection({ resourceType, resourceId }: Props) {
  const user = useSelector((state: RootState) => state.auth.user);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [content, setContent] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchComments = useCallback(() => {
    api
      .get<PaginatedData<CommentItem>>(
        `/api/comments?resourceType=${resourceType}&resourceId=${resourceId}&page=${page}&pageSize=${pageSize}`
      )
      .then((res) => {
        if (res.code === 0) {
          setComments(res.data.list);
          setTotal(res.data.total);
        }
      }).catch(console.error);
  }, [resourceType, resourceId, page]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    try {
      const res = await api.post<CommentItem>("/api/comments", {
        resourceType,
        resourceId,
        content: content.trim(),
      });
      if (res.code === 0) {
        setContent("");
        setPage(1);
        fetchComments();
      }
    } catch { /* ignore comment submit errors */ }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await api.delete(`/api/comments/${commentId}`);
      fetchComments();
    } catch { /* ignore comment delete errors */ }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-4">
        评论 ({total})
      </h3>

      {user ? (
        <div className="mb-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="写下你的评论..."
            rows={3}
            className="w-full rounded-[var(--color-radius)] border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
          <div className="flex justify-end mt-2">
            <Button size="sm" onClick={handleSubmit} disabled={!content.trim()}>
              发表评论
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-muted rounded-[var(--color-radius)] text-center text-sm text-muted-foreground">
          请先登录后再发表评论
        </div>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">暂无评论</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 border border-border rounded-[var(--color-radius)]">
              <img
                src={comment.user.avatar || "/placeholder-cover.svg"}
                alt={comment.user.nickname}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">
                    {comment.user.nickname}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground">{comment.content}</p>
                {(user?.id === comment.user.id || user?.role === "ADMIN") && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-xs text-muted-foreground hover:text-destructive mt-1"
                  >
                    删除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {total > pageSize && (
        <div className="mt-4 flex justify-center">
          <Pagination page={page} totalPages={Math.ceil(total / pageSize)} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
