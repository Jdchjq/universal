"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { register } from "@/store/slices/authSlice";
import { Button, Input } from "@/components/ui";
import Link from "next/link";
import type { AppDispatch } from "@/store";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await dispatch(register({ email, password, nickname })).unwrap();
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message;
      setError(message || "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-[var(--color-radius)] p-6">
      <h2 className="text-lg font-semibold text-foreground mb-6">注册</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="nickname"
          label="昵称"
          placeholder="请输入昵称"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
        />
        <Input
          id="email"
          type="email"
          label="邮箱"
          placeholder="请输入邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          id="password"
          type="password"
          label="密码"
          placeholder="密码不少于8位"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "注册中..." : "注册"}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground text-center mt-4">
        已有账号？
        <Link href="/login" className="text-foreground underline ml-1">
          去登录
        </Link>
      </p>
    </div>
  );
}
