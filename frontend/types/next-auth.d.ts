import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    role?: "ORG_USER" | "ORG_ADMIN" | "SYSTEM_ADMIN";
    organizationId?: number | null;
    accessToken?: string;
    user: DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "ORG_USER" | "ORG_ADMIN" | "SYSTEM_ADMIN";
    organizationId?: number | null;
    accessToken?: string;
  }
}
