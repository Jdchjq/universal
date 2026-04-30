import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/utils";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20")));
  const genre = searchParams.get("genre");
  const type = searchParams.get("type");
  const keyword = searchParams.get("keyword");

  const where: Record<string, unknown> = {};
  if (genre) where.genre = genre;
  if (type) where.type = type;
  if (keyword) {
    where.OR = [
      { title: { contains: keyword } },
      { cast: { some: { artist: { name: { contains: keyword } } } } },
    ];
  }

  const [list, total] = await Promise.all([
    prisma.film.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.film.count({ where }),
  ]);

  const authUser = await getAuthUser();
  const listWithInteractions = await Promise.all(
    list.map(async (film) => {
      let isLiked = false;
      let isWatched = false;
      if (authUser) {
        const [like, watch] = await Promise.all([
          prisma.userLike.findUnique({
            where: { userId_resourceType_resourceId: { userId: authUser.userId, resourceType: "film", resourceId: film.id } },
          }),
          prisma.userWatch.findUnique({
            where: { userId_resourceType_resourceId: { userId: authUser.userId, resourceType: "film", resourceId: film.id } },
          }),
        ]);
        isLiked = !!like;
        isWatched = !!watch;
      }
      return { ...film, releaseDate: film.releaseDate?.toISOString() || null, createdAt: undefined, isLiked, isWatched };
    })
  );

  return success({ list: listWithInteractions, total, page, pageSize });
}
