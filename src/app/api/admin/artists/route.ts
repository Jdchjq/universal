import { prisma } from "@/lib/prisma";
import { success } from "@/lib/utils";

export async function GET() {
  const artists = await prisma.artist.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { albums: true, filmCasts: true } } },
  });
  return success(artists);
}

export async function POST(request: Request) {
  const body = await request.json();
  const artist = await prisma.artist.create({
    data: {
      name: body.name,
      alias: body.alias,
      bio: body.bio,
      avatar: body.avatar,
      category: body.category || "MUSICIAN",
    },
  });
  return success(artist, "创建成功");
}
