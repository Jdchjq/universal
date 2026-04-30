export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4 sm:px-6">
        <p className="text-xs text-muted-foreground">
          宇宙资源总站 — 发现好音乐，遇见好电影
        </p>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Universal Resource Hub
        </p>
      </div>
    </footer>
  );
}
