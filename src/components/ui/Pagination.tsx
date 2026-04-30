"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center gap-1" aria-label="分页导航">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="h-9 px-3 text-sm rounded-[var(--color-radius)] border border-border hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
      >
        上一页
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="h-9 w-9 flex items-center justify-center text-sm text-muted-foreground">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`h-9 w-9 rounded-[var(--color-radius)] text-sm ${p === page ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="h-9 px-3 text-sm rounded-[var(--color-radius)] border border-border hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
      >
        下一页
      </button>
    </nav>
  );
}
