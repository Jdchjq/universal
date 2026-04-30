import { prisma } from "@/lib/prisma";
import { success } from "@/lib/utils";

export async function GET() {
  const [albumCount, filmCount, artistCount, userCount] = await Promise.all([
    prisma.album.count(),
    prisma.film.count(),
    prisma.artist.count(),
    prisma.user.count(),
  ]);

  return success({ albumCount, filmCount, artistCount, userCount });
}
