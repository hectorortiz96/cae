// Shared API client helper for frontend requests.
import { getToken, logout } from '../utils/authUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error('Missing VITE_API_BASE_URL environment variable');
}

const buildUrl = (path: string) => `${API_BASE_URL}${path}`;

type ErrorPayload = { detail?: string; message?: string; title?: string; description?: string };

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;

  const headers = new Headers(init.headers);
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errorPayload =
      typeof payload === 'object' && payload !== null ? (payload as ErrorPayload) : null;
    const errorMessage =
      errorPayload?.detail ??
      errorPayload?.message ??
      errorPayload?.title ??
      `Request failed (${response.status})`;

    const token = getToken();
    const isAuthenticationFailure =
      response.status === 401 ||
      (response.status === 403 && errorPayload?.description === 'The JWT token has expired');

    if (isAuthenticationFailure && token && headers.get('Authorization') === `Bearer ${token}`) {
      logout();
      window.location.replace('/login');
    }

    throw new ApiError(errorMessage, response.status, payload);
  }

  return payload as T;
}