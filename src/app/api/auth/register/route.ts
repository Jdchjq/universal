import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, setTokenCookie } from "@/lib/auth";
import { error } from "@/lib/utils";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, password, nickname } = await request.json();

    if (!email || !password || !nickname) {
      return error("请填写所有必填字段");
    }
    if (password.length < 8) {
      return error("密码长度不能少于8位");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return error("该邮箱已被注册");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, nickname },
    });

    const token = await signToken({ userId: user.id, role: user.role });
    const cookie = setTokenCookie(token);

    const response = NextResponse.json({
      code: 0,
      data: { id: user.id, email: user.email, nickname: user.nickname, avatar: user.avatar, role: user.role },
      message: "注册成功",
    });
    response.cookies.set(cookie);
    return response;
  } catch (e) {
    console.error("Register error:", e);
    return error("注册失败，请稍后重试", 1, 500);
  }
}
