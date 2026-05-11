const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchWithCredentials(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let res = await fetchWithCredentials(path, init);

  if (
    res.status === 401 &&
    path !== "/api/auth/refresh" &&
    path !== "/api/auth/login" &&
    path !== "/api/auth/register" &&
    typeof window !== "undefined"
  ) {
    const refreshRes = await fetchWithCredentials("/api/auth/refresh", {
      method: "POST",
    });
    if (refreshRes.ok) {
      res = await fetchWithCredentials(path, init);
    } else {
      window.location.href = "/login";
      throw new ApiError(401, "Session expired");
    }
  }

  if (!res.ok) {
    if (
      res.status === 401 &&
      path !== "/api/auth/login" &&
      path !== "/api/auth/register" &&
      typeof window !== "undefined"
    ) {
      window.location.href = "/login";
    }
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}
