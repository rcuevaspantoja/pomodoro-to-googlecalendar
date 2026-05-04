import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

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
  const token = await getToken({ req: request });
  if (!token) return null;

  let accessToken = typeof token.accessToken === "string" ? token.accessToken : "";
  const refreshToken = typeof token.refreshToken === "string" ? token.refreshToken : "";
  const expiresAt = typeof token.expiresAt === "number" ? token.expiresAt : 0;
  const nowSec = Date.now() / 1000;

  const shouldRefresh =
    refreshToken.length > 0 && (!accessToken || expiresAt === 0 || nowSec >= expiresAt - 120);

  if (shouldRefresh) {
    try {
      const refreshed = await refreshGoogleAccessToken(refreshToken);
      return refreshed.accessToken;
    } catch {
      return accessToken.length > 0 ? accessToken : null;
    }
  }

  return accessToken.length > 0 ? accessToken : null;
}
