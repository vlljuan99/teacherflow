import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

// Edge-safe Auth.js config — used only by middleware to read the JWT cookie.
// The Credentials provider stays in `./config.ts` (Node runtime, uses bcrypt).
const config: NextAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [],
};

export const { auth } = NextAuth(config);
