"use client";

import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { logout, fetchCurrentUser, performLogout } from "@/store/slices/authSlice";
import { useEffect } from "react";
import { Button } from "@/components/ui";

export function Header() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  const handleLogout = async () => {
    await dispatch(performLogout());
    dispatch(logout());
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-foreground">
            宇宙资源总站
          </Link>
          <nav className="hidden sm:flex items-center gap-4">
            <Link
              href="/music"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              音乐
            </Link>
            <Link
              href="/film"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              影视
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">
                {user.nickname}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                退出
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="secondary" size="sm">
                登录
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
