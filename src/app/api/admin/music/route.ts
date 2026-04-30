import { prisma } from "@/lib/prisma";
import { success } from "@/lib/utils";

export async function GET() {
  const albums = await prisma.album.findMany({
    orderBy: { createdAt: "desc" },
    include: { artist: { select: { name: true } }, tracks: true },
  });
  return success(albums);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, artistId, cover, releaseDate, genre, description, tracks } = body;

  const album = await prisma.album.create({
    data: {
      title,
      artistId,
      cover,
      releaseDate: releaseDate ? new Date(releaseDate) : null,
      genre,
      description,
      trackCount: tracks?.length || 0,
      tracks: {
        create: (tracks || []).map((t: { title: string; artistId: string; duration?: number; trackNo: number }) => ({
          title: t.title,
          artistId: t.artistId || artistId,
          duration: t.duration,
          trackNo: t.trackNo,
        })),
      },
    },
  });
  return success(album, "创建成功");
}
