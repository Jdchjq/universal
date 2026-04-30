import Link from "next/link";
import { Card, CardImage, CardContent } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const [latestAlbums, latestFilms, popularAlbums, popularFilms] =
    await Promise.all([
      prisma.album.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { artist: { select: { name: true } } },
      }),
      prisma.film.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.album.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { artist: { select: { name: true } } },
      }),
      prisma.film.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

  const formatYear = (d: Date | null) =>
    d ? new Date(d).getFullYear() : "未知";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero */}
      <section className="text-center py-12">
        <h1 className="text-3xl font-bold text-foreground mb-3">
          发现好音乐，遇见好电影
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          宇宙资源总站汇集音乐与影视资源信息，不提供下载链接，只呈现纯粹的内容之美。
        </p>
      </section>

      {/* 最新上架 - 音乐 */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">最新上架 · 音乐</h2>
          <Link href="/music" className="text-sm text-muted-foreground hover:text-foreground">
            查看全部 →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {latestAlbums.map((album) => (
            <Link key={album.id} href={`/music/${album.id}`}>
              <Card hover className="h-full">
                <CardImage
                  src={album.cover || "/placeholder-cover.svg"}
                  alt={album.title}
                />
                <CardContent>
                  <p className="text-sm font-medium text-foreground truncate">
                    {album.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {album.artist.name} · {formatYear(album.releaseDate)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* 最新上架 - 影视 */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">最新上架 · 影视</h2>
          <Link href="/film" className="text-sm text-muted-foreground hover:text-foreground">
            查看全部 →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {latestFilms.map((film) => (
            <Link key={film.id} href={`/film/${film.id}`}>
              <Card hover className="h-full">
                <CardImage
                  src={film.cover || "/placeholder-cover.svg"}
                  alt={film.title}
                />
                <CardContent>
                  <p className="text-sm font-medium text-foreground truncate">
                    {film.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {film.type === "MOVIE" ? "电影" : "剧集"} · {formatYear(film.releaseDate)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* 为你推荐（Placeholder） */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4">热门推荐</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {popularAlbums.slice(0, 3).map((album) => (
            <Link key={`hot-${album.id}`} href={`/music/${album.id}`}>
              <Card hover className="h-full">
                <CardImage
                  src={album.cover || "/placeholder-cover.svg"}
                  alt={album.title}
                />
                <CardContent>
                  <p className="text-sm font-medium text-foreground truncate">
                    {album.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {album.artist.name}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
          {popularFilms.slice(0, 3).map((film) => (
            <Link key={`hot-${film.id}`} href={`/film/${film.id}`}>
              <Card hover className="h-full">
                <CardImage
                  src={film.cover || "/placeholder-cover.svg"}
                  alt={film.title}
                />
                <CardContent>
                  <p className="text-sm font-medium text-foreground truncate">
                    {film.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {film.type === "MOVIE" ? "电影" : "剧集"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
