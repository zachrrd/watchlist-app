import { neon } from "./neon";

export async function getJwtToken(): Promise<string | null> {
  const { data, error } = await neon.auth.getSession();
  if (error) {
    console.error("getSession error:", error);
    return null;
  }
  // data.session.token adalah JWT (bukan opaque session cookie)
  return data?.session?.token ?? null;
}