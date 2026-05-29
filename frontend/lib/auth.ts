import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const { auth, handlers, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  providers: [
    CredentialsProvider({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // DEVELOPMENT: Bypass authentication - accept any email/password
        return {
          id: "dev-user-1",
          email: credentials.email,
          name: credentials.email.split("@")[0],
          role: "SYSTEM_ADMIN",
          organizationId: "1",
          accessToken: "dev-token-bypass",
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Persist custom fields into the JWT on sign-in
        token.role = (user as any).role;
        token.organizationId = (user as any).organizationId;
        token.accessToken = (user as any).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).role = token.role;
      (session as any).organizationId = token.organizationId;
      (session as any).accessToken = token.accessToken;
      return session;
    },
  },
});
