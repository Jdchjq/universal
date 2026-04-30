import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/utils";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) return error("请先登录", 1, 401);

  // Check for pre-computed recommendations
  const existing = await prisma.recommendation.findMany({
    where: { userId: authUser.userId },
    orderBy: { score: "desc" },
    take: 12,
  });

  if (existing.length > 0) {
    const items = await Promise.all(
      existing.map(async (rec) => {
        if (rec.resourceType === "album") {
          const album = await prisma.album.findUnique({
            where: { id: rec.resourceId },
            include: { artist: { select: { name: true } } },
          });
          return album ? { ...album, releaseDate: album.releaseDate?.toISOString() || null, _reason: rec.reason, _score: rec.score } : null;
        }
        const film = await prisma.film.findUnique({ where: { id: rec.resourceId } });
        return film ? { ...film, releaseDate: film.releaseDate?.toISOString() || null, _reason: rec.reason, _score: rec.score } : null;
      })
    );
    return success(items.filter(Boolean));
  }

  // Fallback: content-based from user likes
  const likes = await prisma.userLike.findMany({
    where: { userId: authUser.userId },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  if (likes.length === 0) {
    // New user: return popular items
    const [albums, films] = await Promise.all([
      prisma.album.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: { artist: { select: { name: true } } },
      }),
      prisma.film.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
      }),
    ]);
    const items = [
      ...albums.map((a) => ({ ...a, releaseDate: a.releaseDate?.toISOString() || null, _reason: "热门推荐" })),
      ...films.map((f) => ({ ...f, releaseDate: f.releaseDate?.toISOString() || null, _reason: "热门推荐" })),
    ];
    return success(items);
  }

  // Content-based: find same genre/artist
  const likedAlbums = likes.filter((l) => l.resourceType === "album");
  const likedFilms = likes.filter((l) => l.resourceType === "film");

  const albumIds = likedAlbums.map((l) => l.resourceId);
  const filmIds = likedFilms.map((l) => l.resourceId);

  const [likedAlbumData, likedFilmData] = await Promise.all([
    albumIds.length > 0
      ? prisma.album.findMany({
          where: { id: { in: albumIds } },
          select: { genre: true, artistId: true },
        })
      : [],
    filmIds.length > 0
      ? prisma.film.findMany({
          where: { id: { in: filmIds } },
          select: { genre: true },
        })
      : [],
  ]);

  const albumGenres = [...new Set(likedAlbumData.map((a) => a.genre).filter((g): g is string => g !== null))];
  const albumArtists = [...new Set(likedAlbumData.map((a) => a.artistId))];
  const filmGenres = [...new Set(likedFilmData.map((f) => f.genre).filter((g): g is string => g !== null))];

  const [similarAlbums, similarFilms] = await Promise.all([
    prisma.album.findMany({
      where: {
        OR: [
          { genre: { in: albumGenres } },
          { artistId: { in: albumArtists } },
        ],
        id: { notIn: albumIds },
      },
      take: 6,
      include: { artist: { select: { name: true } } },
    }),
    prisma.film.findMany({
      where: {
        genre: { in: filmGenres },
        id: { notIn: filmIds },
      },
      take: 6,
    }),
  ]);

  const items = [
    ...similarAlbums.map((a) => ({ ...a, releaseDate: a.releaseDate?.toISOString() || null, _reason: `因为你喜欢 ${a.genre || "相似"} 类型的音乐` })),
    ...similarFilms.map((f) => ({ ...f, releaseDate: f.releaseDate?.toISOString() || null, _reason: `因为你喜欢 ${f.genre || "相似"} 类型的影视` })),
  ];

  return success(items);
}

// Trigger recalculation (called when user interactions change)
export async function POST() {
  const authUser = await getAuthUser();
  if (!authUser) return error("请先登录", 1, 401);

  // Clear old recommendations
  await prisma.recommendation.deleteMany({ where: { userId: authUser.userId } });

  // Compute new recommendations (simplified: same genre)
  const likes = await prisma.userLike.findMany({
    where: { userId: authUser.userId },
    take: 10,
  });

  if (likes.length === 0) return success(null, "暂无数据");

  const albumIds = likes.filter((l) => l.resourceType === "album").map((l) => l.resourceId);
  const filmIds = likes.filter((l) => l.resourceType === "film").map((l) => l.resourceId);

  const likedAlbums = albumIds.length > 0
    ? await prisma.album.findMany({ where: { id: { in: albumIds } }, select: { genre: true, artistId: true } })
    : [];
  const likedFilms = filmIds.length > 0
    ? await prisma.film.findMany({ where: { id: { in: filmIds } }, select: { genre: true } })
    : [];

  const genres = [...new Set([...likedAlbums.map((a) => a.genre), ...likedFilms.map((f) => f.genre)].filter((g): g is string => g !== null))];
  const artistIds = [...new Set(likedAlbums.map((a) => a.artistId))];

  if (genres.length > 0 || artistIds.length > 0) {
    const similarAlbums = await prisma.album.findMany({
      where: {
        OR: [
          { genre: { in: genres } },
          { artistId: { in: artistIds } },
        ],
        id: { notIn: albumIds },
      },
      take: 10,
    });

    for (const album of similarAlbums) {
      await prisma.recommendation.create({
        data: {
          userId: authUser.userId,
          resourceType: "album",
          resourceId: album.id,
          score: 0.8,
          reason: `因为你喜欢 ${album.genre || "相似"} 类型的音乐`,
        },
      });
    }
  }

  return success(null, "推荐已更新");
}
