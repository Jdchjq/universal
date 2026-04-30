import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, setTokenCookie } from "@/lib/auth";
import { error } from "@/lib/utils";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return error("请填写邮箱和密码");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return error("邮箱或密码错误");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return error("邮箱或密码错误");
    }

    const token = await signToken({ userId: user.id, role: user.role });
    const cookie = setTokenCookie(token);

    const response = NextResponse.json({
      code: 0,
      data: { id: user.id, email: user.email, nickname: user.nickname, avatar: user.avatar, role: user.role },
      message: "登录成功",
    });
    response.cookies.set(cookie);
    return response;
  } catch (e) {
    console.error("Login error:", e);
    return error("登录失败，请稍后重试", 1, 500);
  }
}
