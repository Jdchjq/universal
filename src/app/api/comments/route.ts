import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/utils";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const resourceType = searchParams.get("resourceType");
  const resourceId = searchParams.get("resourceId");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20")));

  if (!resourceType || !resourceId) {
    return error("缺少 resourceType 或 resourceId 参数");
  }

  const [list, total] = await Promise.all([
    prisma.comment.findMany({
      where: { resourceType, resourceId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, nickname: true, avatar: true } } },
    }),
    prisma.comment.count({ where: { resourceType, resourceId } }),
  ]);

  const result = list.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  return success({ list: result, total, page, pageSize });
}

export async function POST(request: Request) {
  const authUser = await getAuthUser();
  if (!authUser) return error("请先登录", 1, 401);

  const { resourceType, resourceId, content } = await request.json();
  if (!resourceType || !resourceId || !content) {
    return error("请填写完整的评论信息");
  }
  if (!content.trim()) {
    return error("评论内容不能为空");
  }

  const comment = await prisma.comment.create({
    data: {
      userId: authUser.userId,
      resourceType,
      resourceId,
      content: content.trim(),
    },
    include: { user: { select: { id: true, nickname: true, avatar: true } } },
  });

  return success({ ...comment, createdAt: comment.createdAt.toISOString() }, "评论成功");
}
