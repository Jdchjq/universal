import { prisma } from "@/lib/prisma";
import { success } from "@/lib/utils";
import { getMovieImages, buildImageUrl, pickPrimaryPoster } from "@/services/tmdb";

export async function GET() {
  const films = await prisma.film.findMany({
    orderBy: { createdAt: "desc" },
    include: { cast: { include: { artist: { select: { name: true } } } } },
  });
  return success(films);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, cover, releaseDate, genre, duration, country, description, type, cast, tmdbId } = body;

  const film = await prisma.film.create({
    data: {
      title,
      cover,
      releaseDate: releaseDate ? new Date(releaseDate) : null,
      genre,
      duration,
      country,
      description,
      type: type || "MOVIE",
      cast: {
        create: (cast || []).map((c: { artistId: string; role: string; characterName?: string }) => ({
          artistId: c.artistId,
          role: c.role,
          characterName: c.characterName,
        })),
      },
    },
  });

  if (tmdbId) {
    try {
      const images = await getMovieImages(Number(tmdbId));
      const allPosters = images.posters.filter((p) => p.file_path);
      const primary = pickPrimaryPoster(allPosters);

      const imageData = allPosters.map((p, i) => ({
        filmId: film.id,
        type: "POSTER" as const,
        url: buildImageUrl(p.file_path),
        width: p.width,
        height: p.height,
        language: p.iso_639_1,
        voteAvg: p.vote_average,
        voteCount: p.vote_count,
        isPrimary: primary ? p.file_path === primary.file_path : i === 0,
        sortOrder: i,
      }));

      if (imageData.length > 0) {
        await prisma.filmImage.createMany({ data: imageData });
        const primaryImage = imageData.find((img) => img.isPrimary) || imageData[0];
        await prisma.film.update({
          where: { id: film.id },
          data: { cover: primaryImage.url },
        });
      }
    } catch {
      // 图片拉取失败不阻塞电影创建
    }
  }

  return success(film, "创建成功");
}
