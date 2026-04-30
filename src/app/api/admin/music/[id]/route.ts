import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { title, artistId, cover, releaseDate, genre, description, tracks } = body;

  await prisma.track.deleteMany({ where: { albumId: id } });

  const album = await prisma.album.update({
    where: { id },
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
  return success(album, "更新成功");
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.album.delete({ where: { id } });
  return success(null, "删除成功");
}
