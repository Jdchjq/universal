import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/utils";
import { getAuthUser } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser();
  if (!authUser) return error("请先登录", 1, 401);

  const { id } = await params;
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) return error("评论不存在", 1, 404);

  if (comment.userId !== authUser.userId && authUser.role !== "ADMIN") {
    return error("无权删除此评论", 1, 403);
  }

  await prisma.comment.delete({ where: { id } });
  return success(null, "评论已删除");
}
