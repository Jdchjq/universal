import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20")));
  const category = searchParams.get("category");
  const keyword = searchParams.get("keyword");

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { alias: { contains: keyword } },
    ];
  }

  const [list, total] = await Promise.all([
    prisma.artist.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.artist.count({ where }),
  ]);

  return success({ list, total, page, pageSize });
}
