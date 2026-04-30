import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { title, cover, releaseDate, genre, duration, country, description, type, cast } = body;

  await prisma.filmCast.deleteMany({ where: { filmId: id } });

  const film = await prisma.film.update({
    where: { id },
    data: {
      title,
      cover,
      releaseDate: releaseDate ? new Date(releaseDate) : null,
      genre,
      duration,
      country,
      description,
      type,
      cast: {
        create: (cast || []).map((c: { artistId: string; role: string; characterName?: string }) => ({
          artistId: c.artistId,
          role: c.role,
          characterName: c.characterName,
        })),
      },
    },
  });
  return success(film, "更新成功");
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.film.delete({ where: { id } });
  return success(null, "删除成功");
}
