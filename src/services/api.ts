import { ApiResponse } from "@/types";

class ApiClient {
  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const res = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let message = res.statusText;
      try {
        const json = JSON.parse(text);
        if (json.message) message = json.message;
      } catch {}
      throw new Error(message);
    }

    const text = await res.text();
    if (!text) {
      return { code: 0, data: null as T, message: "ok" } as ApiResponse<T>;
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Invalid JSON response: ${text.slice(0, 200)}`);
    }
  }

  async get<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url);
  }

  async post<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: "DELETE" });
  }
}

export const api = new ApiClient();
