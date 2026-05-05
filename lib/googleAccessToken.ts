import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/** NextAuth / Google sometimes store absolute expiry as ms; API logic expects Unix seconds. */
export function normalizeOAuthExpiresAtSeconds(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value > 1_000_000_000_000 ? Math.floor(value / 1000) : Math.floor(value);
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing Google OAuth credentials");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
    error?: string;
  };

  if (!response.ok || !json.access_token) {
    throw new Error(json.error ?? "refresh_failed");
  }

  const expiresIn = typeof json.expires_in === "number" ? json.expires_in : 3600;
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Math.floor(Date.now() / 1000 + expiresIn),
  };
}

/**
 * Obtiene un access token de Google válido para esta petición.
 * `getToken` no ejecuta el callback JWT de NextAuth, así que la renovación debe hacerse aquí en rutas API.
 */
export async function resolveGoogleAccessTokenFromRequest(request: NextRequest): Promise<string | null> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token) return null;

  const accessToken = typeof token.accessToken === "string" ? token.accessToken : "";
  const refreshToken = typeof token.refreshToken === "string" ? token.refreshToken : "";
  const expiresAt = normalizeOAuthExpiresAtSeconds(
    typeof token.expiresAt === "number" ? token.expiresAt : 0,
  );
  const nowSec = Date.now() / 1000;

  const accessStillFresh =
    accessToken.length > 0 && expiresAt > 0 && nowSec < expiresAt - 120;

  if (accessStillFresh) {
    return accessToken;
  }

  if (refreshToken.length > 0) {
    try {
      return (await refreshGoogleAccessToken(refreshToken)).accessToken;
    } catch {
      return null;
    }
  }

  // Sin refresh_token: solo devolver access si aún no ha caducado (evita mandar token muerto a Drive → 500).
  if (accessToken.length > 0 && expiresAt > 0 && nowSec < expiresAt) {
    return accessToken;
  }

  // JWT antiguo sin expiresAt: último intento con el access guardado (puede fallar en Google si ya expiró).
  if (accessToken.length > 0 && expiresAt === 0) {
    return accessToken;
  }

  return null;
}

/** Maps Gaxios / googleapis failures to HTTP status (avoid reporting Google 401 as 500). */
export function httpStatusFromGoogleApiError(error: unknown): number {
  if (error && typeof error === "object" && "response" in error) {
    const status = (error as { response?: { status?: number } }).response?.status;
    if (status === 401) return 401;
    if (status === 403) return 403;
  }
  return 500;
}
