"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "仪表盘" },
  { href: "/admin/artists", label: "艺人管理" },
  { href: "/admin/music", label: "音乐管理" },
  { href: "/admin/film", label: "影视管理" },
  { href: "/admin/import", label: "批量导入" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r border-border bg-card p-4">
        <h1 className="text-lg font-bold text-foreground mb-6">管理后台</h1>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 text-sm rounded-[var(--color-radius)] transition-colors ${pathname === item.href ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-4">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← 返回前台
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-6 bg-background">{children}</main>
    </div>
  );
}
