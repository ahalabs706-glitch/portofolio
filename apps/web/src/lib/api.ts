import type { CvData, CvDocument, CvTemplate } from "@devfolio/shared";

let csrfToken: string | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiEnvelope<T> {
  data: T;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  if (
    csrfToken &&
    init.method &&
    !["GET", "HEAD", "OPTIONS"].includes(init.method.toUpperCase())
  ) {
    headers.set("X-CSRF-Token", csrfToken);
  }

  const response = await fetch(`/api/v1${path}`, {
    ...init,
    headers,
    credentials: "same-origin",
  });
  if (response.status === 204) return undefined as T;

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = body as { error?: { code?: string; message?: string } } | null;
    throw new ApiError(
      error?.error?.message ?? "The request could not be completed.",
      response.status,
      error?.error?.code ?? "REQUEST_FAILED",
    );
  }
  return (body as ApiEnvelope<T>).data;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthSession {
  user: AuthUser;
  csrfToken: string;
}

export function updateCsrfToken(token: string | null) {
  csrfToken = token;
}

export function fetchCurrentSession() {
  return request<AuthSession>("/auth/me");
}

export async function registerAccount(email: string, password: string) {
  const session = await request<AuthSession>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  updateCsrfToken(session.csrfToken);
  return session;
}

export async function loginAccount(email: string, password: string) {
  const session = await request<AuthSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  updateCsrfToken(session.csrfToken);
  return session;
}

export async function logoutAccount() {
  await request<void>("/auth/logout", { method: "POST" });
  updateCsrfToken(null);
}

export async function listCvDocuments() {
  return request<CvDocument[]>("/cvs?page=1&limit=50");
}

export function getCvDocument(id: string) {
  return request<CvDocument>(`/cvs/${encodeURIComponent(id)}`);
}

export function createCvDocument(data: CvData) {
  return request<CvDocument>("/cvs", {
    method: "POST",
    body: JSON.stringify({ template: "modern", data }),
  });
}

export function saveCvDocument(id: string, data: CvData, template: CvTemplate) {
  return request<CvDocument>(`/cvs/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ template, data }),
  });
}

export function duplicateCvDocument(id: string) {
  return request<CvDocument>(`/cvs/${encodeURIComponent(id)}/duplicate`, {
    method: "POST",
  });
}

export function deleteCvDocument(id: string) {
  return request<void>(`/cvs/${encodeURIComponent(id)}`, { method: "DELETE" });
}
