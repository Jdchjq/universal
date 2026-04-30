import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/utils";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const film = await prisma.film.findUnique({
    where: { id },
    include: {
      cast: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          role: true,
          characterName: true,
          sortOrder: true,
          artist: { select: { id: true, name: true, avatar: true } },
        },
      },
      images: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          type: true,
          url: true,
          width: true,
          height: true,
          language: true,
          isPrimary: true,
        },
      },
    },
  });

  if (!film) return error("资源未找到", 1, 404);

  const authUser = await getAuthUser();
  let isLiked = false;
  let isWatched = false;
  if (authUser) {
    const [like, watch] = await Promise.all([
      prisma.userLike.findUnique({
        where: { userId_resourceType_resourceId: { userId: authUser.userId, resourceType: "film", resourceId: id } },
      }),
      prisma.userWatch.findUnique({
        where: { userId_resourceType_resourceId: { userId: authUser.userId, resourceType: "film", resourceId: id } },
      }),
    ]);
    isLiked = !!like;
    isWatched = !!watch;
  }

  return success({
    ...film,
    releaseDate: film.releaseDate?.toISOString() || null,
    createdAt: undefined,
    isLiked,
    isWatched,
  });
}
