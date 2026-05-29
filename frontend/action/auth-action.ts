'use server'
import { signIn } from "@/lib/auth";

export const loginUser = async (data: { email: string; password: string }) => {
  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    return { ok: true };
  } catch (error: any) {
    // next-auth throws CredentialsSignin when authorize returns null
    if (error?.type === "CredentialsSignin") {
      return { error: "Invalid email or password" };
    }
    return { error: error?.message || "Login failed" };
  }
};