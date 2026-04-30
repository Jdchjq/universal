import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/utils";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return error("请先登录", 1, 401);

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20")));

  const [list, total] = await Promise.all([
    prisma.userWatch.findMany({
      where: { userId: authUser.userId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { watchedAt: "desc" },
    }),
    prisma.userWatch.count({ where: { userId: authUser.userId } }),
  ]);

  return success({ list, total, page, pageSize });
}

export async function POST(request: Request) {
  const authUser = await getAuthUser();
  if (!authUser) return error("请先登录", 1, 401);

  const { resourceType, resourceId } = await request.json();
  if (!resourceType || !resourceId) return error("缺少必要参数");

  const existing = await prisma.userWatch.findUnique({
    where: { userId_resourceType_resourceId: { userId: authUser.userId, resourceType, resourceId } },
  });

  if (!existing) {
    await prisma.userWatch.create({
      data: { userId: authUser.userId, resourceType, resourceId },
    });
  }

  return success(null, "已标记");
}

export async function DELETE(request: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return error("请先登录", 1, 401);

  const { searchParams } = request.nextUrl;
  const resourceType = searchParams.get("resourceType");
  const resourceId = searchParams.get("resourceId");
  if (!resourceType || !resourceId) return error("缺少必要参数");

  await prisma.userWatch.deleteMany({
    where: { userId: authUser.userId, resourceType, resourceId },
  });

  return success(null, "已取消标记");
}
