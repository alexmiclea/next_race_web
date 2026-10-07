import { cookies } from "next/headers";
import { FAVORITES_COOKIE, parseFavorites } from "@/lib/favorites";

/** The visitor's favourite event ids, from their cookie (server components only). */
export async function getFavoriteIds(): Promise<string[]> {
  return parseFavorites((await cookies()).get(FAVORITES_COOKIE)?.value);
}
