export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(body.error ?? res.statusText, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function apiGet<T>(url: string, signal?: AbortSignal) {
  return apiFetch<T>(url, { signal });
}

export function apiPost<T>(url: string, data?: unknown) {
  return apiFetch<T>(url, { method: "POST", body: data ? JSON.stringify(data) : undefined });
}

export function apiPut<T>(url: string, data: unknown) {
  return apiFetch<T>(url, { method: "PUT", body: JSON.stringify(data) });
}

export function apiDelete<T>(url: string) {
  return apiFetch<T>(url, { method: "DELETE" });
}
