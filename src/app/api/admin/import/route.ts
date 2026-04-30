import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, items } = body;

    if (!type || !Array.isArray(items) || items.length === 0) {
      return error("请提供有效的导入数据");
    }

    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const item = items[i];
        if (type === "album") {
          await prisma.album.create({
            data: {
              title: item.title,
              artistId: item.artistId,
              cover: item.cover,
              releaseDate: item.releaseDate ? new Date(item.releaseDate) : null,
              genre: item.genre,
              description: item.description,
              trackCount: item.tracks?.length || 0,
            },
          });
        } else if (type === "film") {
          await prisma.film.create({
            data: {
              title: item.title,
              cover: item.cover,
              releaseDate: item.releaseDate ? new Date(item.releaseDate) : null,
              genre: item.genre,
              duration: item.duration,
              country: item.country,
              description: item.description,
              type: item.type || "MOVIE",
            },
          });
        } else if (type === "artist") {
          await prisma.artist.create({
            data: {
              name: item.name,
              alias: item.alias,
              bio: item.bio,
              avatar: item.avatar,
              category: item.category || "MUSICIAN",
            },
          });
        }
        successCount++;
      } catch (e) {
        errors.push(`第 ${i + 1} 条: ${e instanceof Error ? e.message : "未知错误"}`);
      }
    }

    return success({ successCount, failCount: items.length - successCount, errors });
  } catch {
    return error("导入失败，请检查数据格式");
  }
}
