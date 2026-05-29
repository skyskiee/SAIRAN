import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const API_URL = process.env.API_URL || "http://localhost:8000/api/v1";

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
        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            cache: "no-store",
          });
          if (!res.ok) return null;
          const data = await res.json();
          // Return a User-shaped object; extra fields flow through via callbacks.
          return {
            id: String(data.user.id),
            email: data.user.email,
            name: data.user.full_name,
            // Custom fields
            role: data.user.role,
            organizationId: data.user.organization_id,
            accessToken: data.access_token,
          } as any;
        } catch (err) {
          console.error("Login error:", err);
          return null;
        }
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
