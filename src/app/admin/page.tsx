"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Card, CardContent } from "@/components/ui";

interface DashboardData {
  albumCount: number;
  filmCount: number;
  artistCount: number;
  userCount: number;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.get<DashboardData>("/api/admin/dashboard").then((res) => {
      if (res.code === 0) setData(res.data);
    }).catch(console.error);
  }, []);

  if (!data) return <div className="text-muted-foreground">加载中...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">仪表盘</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">专辑数</p>
            <p className="text-2xl font-bold text-foreground">{data.albumCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">影视数</p>
            <p className="text-2xl font-bold text-foreground">{data.filmCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">艺人/创作者数</p>
            <p className="text-2xl font-bold text-foreground">{data.artistCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">用户数</p>
            <p className="text-2xl font-bold text-foreground">{data.userCount}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
