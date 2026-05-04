import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    /** Set when the Google refresh token flow fails; user should sign in again. */
    error?: string;
    user?: DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    /** Unix timestamp (seconds) when accessToken expires */
    expiresAt?: number;
    error?: string;
  }
}
