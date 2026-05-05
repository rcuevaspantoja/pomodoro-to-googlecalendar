import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { normalizeOAuthExpiresAtSeconds, refreshGoogleAccessToken } from "@/lib/googleAccessToken";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret) {
  throw new Error(
    "Faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET en .env.local. NextAuth no puede iniciar Google OAuth.",
  );
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/calendar.events",
          access_type: "offline",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
        if (account.refresh_token) {
          token.refreshToken = account.refresh_token;
        }
        token.expiresAt =
          typeof account.expires_at === "number"
            ? normalizeOAuthExpiresAtSeconds(account.expires_at)
            : Math.floor(Date.now() / 1000 + 3600);
        token.error = undefined;
        return token;
      }

      const refreshToken = token.refreshToken;
      const expiresAtRaw = token.expiresAt;
      if (typeof refreshToken === "string" && refreshToken.length > 0) {
        const exp =
          typeof expiresAtRaw === "number" ? normalizeOAuthExpiresAtSeconds(expiresAtRaw) : 0;
        token.expiresAt = exp;
        const refreshIfBefore = exp - 120;
        const shouldRefresh = exp === 0 || Date.now() / 1000 >= refreshIfBefore;
        if (shouldRefresh) {
          try {
            const refreshed = await refreshGoogleAccessToken(refreshToken);
            token.accessToken = refreshed.accessToken;
            token.expiresAt = refreshed.expiresAt;
            if (refreshed.refreshToken) {
              token.refreshToken = refreshed.refreshToken;
            }
            token.error = undefined;
          } catch {
            token.error = "RefreshAccessTokenError";
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      if (token.error) {
        session.error = token.error as string;
      }

      return session;
    },
  },
};
