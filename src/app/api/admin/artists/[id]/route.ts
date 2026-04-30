import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const artist = await prisma.artist.update({
    where: { id },
    data: { name: body.name, alias: body.alias, bio: body.bio, avatar: body.avatar, category: body.category },
  });
  return success(artist, "更新成功");
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [albums, filmCasts] = await Promise.all([
    prisma.album.count({ where: { artistId: id } }),
    prisma.filmCast.count({ where: { artistId: id } }),
  ]);
  if (albums > 0 || filmCasts > 0) {
    return error("该艺人与作品关联，请先删除相关作品");
  }
  await prisma.artist.delete({ where: { id } });
  return success(null, "删除成功");
}
