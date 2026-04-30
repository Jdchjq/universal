import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const artist = await prisma.artist.findUnique({
    where: { id },
    include: {
      albums: {
        select: { id: true, title: true, cover: true, releaseDate: true },
        orderBy: { releaseDate: "desc" },
      },
      filmCasts: {
        select: {
          role: true,
          film: { select: { id: true, title: true, cover: true, releaseDate: true } },
        },
      },
    },
  });

  if (!artist) return error("资源未找到", 1, 404);

  return success({
    ...artist,
    films: artist.filmCasts.map((fc) => ({
      ...fc.film,
      role: fc.role,
    })),
    filmCasts: undefined,
    createdAt: undefined,
  });
}
