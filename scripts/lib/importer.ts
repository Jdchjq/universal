import { prisma } from "../../src/lib/prisma";
import type { AggregatedData } from "./aggregator";

export async function importFilm(data: AggregatedData): Promise<{ filmId: string; isNew: boolean }> {
  const { film, artists } = data;

  const existing = await prisma.film.findFirst({
    where: {
      title: film.title,
      releaseDate: film.releaseDate ? new Date(film.releaseDate) : null,
    },
    include: { cast: true },
  });

  if (existing) {
    // 更新影片信息 — 以最新爬取数据覆盖
    await prisma.film.update({
      where: { id: existing.id },
      data: {
        cover: film.cover,
        genre: film.genre,
        duration: film.duration,
        country: film.country,
        description: film.description,
      },
    });

    // 演职人员：更新已有 + 新建缺失
    let updatedCount = 0;
    for (const a of artists) {
      const upserted = await prisma.artist.upsert({
        where: { name_category: { name: a.name, category: a.category } },
        create: {
          name: a.name,
          alias: a.englishName || undefined,
          avatar: a.avatar || undefined,
          bio: a.bio || undefined,
          category: a.category,
        },
        update: {
          alias: a.englishName || undefined,
          avatar: a.avatar || undefined,
          bio: a.bio || undefined,
        },
      });

      // FilmCast：不存在则新增，存在则更新 sortOrder + characterName
      const existingCast = existing.cast.find(
        (c) => c.artistId === upserted.id && c.role === a.role
      );
      if (!existingCast) {
        await prisma.filmCast.create({
          data: {
            filmId: existing.id,
            artistId: upserted.id,
            role: a.role,
            characterName: a.characterName || undefined,
            sortOrder: a.sortOrder,
          },
        });
        updatedCount++;
      } else {
        const patch: Record<string, unknown> = {};
        if (a.characterName && !existingCast.characterName) patch.characterName = a.characterName;
        if (existingCast.sortOrder !== a.sortOrder) patch.sortOrder = a.sortOrder;
        if (Object.keys(patch).length > 0) {
          await prisma.filmCast.update({ where: { id: existingCast.id }, data: patch });
        }
      }
    }

    console.log(`  已更新影片，同步 ${artists.length} 位演职人员 (新增 ${updatedCount} 个关联)`);
    return { filmId: existing.id, isNew: false };
  }

  // 新建
  const created = await prisma.film.create({
    data: {
      title: film.title,
      cover: film.cover,
      releaseDate: film.releaseDate ? new Date(film.releaseDate) : null,
      genre: film.genre,
      duration: film.duration,
      country: film.country,
      description: film.description,
      type: film.type,
      cast: {
        create: await Promise.all(
          artists.map(async (a) => ({
            artist: {
              connectOrCreate: {
                where: { name_category: { name: a.name, category: a.category } },
                create: {
                  name: a.name,
                  alias: a.englishName || undefined,
                  avatar: a.avatar || undefined,
                  bio: a.bio || undefined,
                  category: a.category,
                },
              },
            },
            role: a.role,
            characterName: a.characterName,
            sortOrder: a.sortOrder,
          }))
        ),
      },
    },
  });

  console.log(`  新建影片 + ${artists.length} 位演职人员`);
  return { filmId: created.id, isNew: true };
}
