const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

if (!API_BASE_URL) {
  throw new Error('Missing VITE_API_BASE_URL environment variable')
}

const buildUrl = (path: string) => `${API_BASE_URL}${path}`

export class ApiError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })

  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const errorMessage =
      typeof payload === 'object' && payload !== null
        ? ((payload as { detail?: string; message?: string; title?: string }).detail ??
          (payload as { detail?: string; message?: string; title?: string }).message ??
          (payload as { detail?: string; message?: string; title?: string }).title ??
          `Request failed (${response.status})`)
        : `Request failed (${response.status})`

    throw new ApiError(errorMessage, response.status, payload)
  }

  return payload as T
}

