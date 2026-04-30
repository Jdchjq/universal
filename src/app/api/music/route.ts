import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/utils";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20")));
  const genre = searchParams.get("genre");
  const keyword = searchParams.get("keyword");

  const where: Record<string, unknown> = {};
  if (genre) where.genre = genre;
  if (keyword) {
    where.OR = [
      { title: { contains: keyword } },
      { artist: { name: { contains: keyword } } },
    ];
  }

  const [list, total] = await Promise.all([
    prisma.album.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: { artist: { select: { id: true, name: true } } },
    }),
    prisma.album.count({ where }),
  ]);

  const authUser = await getAuthUser();
  const listWithInteractions = await Promise.all(
    list.map(async (album) => {
      let isLiked = false;
      let isWatched = false;
      if (authUser) {
        const [like, watch] = await Promise.all([
          prisma.userLike.findUnique({
            where: { userId_resourceType_resourceId: { userId: authUser.userId, resourceType: "album", resourceId: album.id } },
          }),
          prisma.userWatch.findUnique({
            where: { userId_resourceType_resourceId: { userId: authUser.userId, resourceType: "album", resourceId: album.id } },
          }),
        ]);
        isLiked = !!like;
        isWatched = !!watch;
      }
      return { ...album, releaseDate: album.releaseDate?.toISOString() || null, createdAt: undefined, isLiked, isWatched };
    })
  );

  return success({ list: listWithInteractions, total, page, pageSize });
}
