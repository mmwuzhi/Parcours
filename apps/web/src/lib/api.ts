const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.error ?? `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}
