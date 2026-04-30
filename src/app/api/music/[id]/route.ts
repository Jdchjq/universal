import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/utils";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const album = await prisma.album.findUnique({
    where: { id },
    include: {
      artist: { select: { id: true, name: true, alias: true, bio: true, avatar: true } },
      tracks: { orderBy: { trackNo: "asc" }, select: { id: true, title: true, duration: true, trackNo: true } },
    },
  });

  if (!album) return error("资源未找到", 1, 404);

  const authUser = await getAuthUser();
  let isLiked = false;
  let isWatched = false;
  if (authUser) {
    const [like, watch] = await Promise.all([
      prisma.userLike.findUnique({
        where: { userId_resourceType_resourceId: { userId: authUser.userId, resourceType: "album", resourceId: id } },
      }),
      prisma.userWatch.findUnique({
        where: { userId_resourceType_resourceId: { userId: authUser.userId, resourceType: "album", resourceId: id } },
      }),
    ]);
    isLiked = !!like;
    isWatched = !!watch;
  }

  return success({
    ...album,
    releaseDate: album.releaseDate?.toISOString() || null,
    createdAt: undefined,
    isLiked,
    isWatched,
  });
}
