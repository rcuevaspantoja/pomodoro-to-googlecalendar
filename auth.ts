import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

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
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
};
