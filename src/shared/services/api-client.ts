const TOKEN_KEY = "ims_auth_token";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getAuthHeaders(): Record<string, string> {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) return { Authorization: `Bearer ${token}` };
  } catch { /* localStorage unavailable */ }
  return {};
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const { headers: extraHeaders, ...rest } = options ?? {};
  const res = await fetch(url, {
    ...rest,
    headers: { "Content-Type": "application/json", ...getAuthHeaders(), ...extraHeaders },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(body.error ?? res.statusText, res.status);
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json();
  if (body && typeof body === "object" && "success" in body && body.success === true && "data" in body) {
    return body.data as T;
  }
  return body as T;
}

export function apiGet<T>(url: string, options?: RequestInit) {
  return apiFetch<T>(url, { method: "GET", ...options });
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
