import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { env, logEnvIssues } from "@/lib/env";
import { syncUserFromGoogle } from "@/lib/user-sync";

logEnvIssues();

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: env.authSecret,
  debug: process.env.NODE_ENV === "development",
  providers: [
    Google({
      clientId: env.googleClientId,
      clientSecret: env.googleClientSecret,
    }),
  ],
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  logger: {
    error(error) {
      console.error("[auth]", error);
    },
  },
  events: {
    async signIn({ user }) {
      if (user.email) {
        void syncUserFromGoogle(user.email, user.name ?? undefined);
      }
    },
  },
  callbacks: {
    async signIn({ user }) {
      return !!user.email;
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.displayName) {
        token.displayName = session.displayName as string;
        return token;
      }

      if (user?.email) {
        token.email = user.email;
        token.displayName =
          (user.name?.trim() || token.displayName || "") as string;
      }

      const email = user?.email ?? token.email;
      if (email && user && !token.userId) {
        const synced = await syncUserFromGoogle(
          email as string,
          user.name ?? undefined
        );
        if (synced?.id) token.userId = synced.id;
        if (synced?.displayName?.trim()) {
          token.displayName = synced.displayName;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id =
          (token.userId as string) ?? (token.email as string) ?? "";
        session.user.displayName =
          (token.displayName as string)?.trim() ||
          session.user.name?.trim() ||
          "";
      }
      return session;
    },
  },
});
