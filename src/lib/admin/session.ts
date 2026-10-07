import "server-only";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * The signed-in admin, or null. Checks both that someone is signed in and that they are
 * on the admin list (the database's is_admin()). The database rules enforce the same
 * thing on every query, so this is a convenience, not the only protection.
 */
export async function getAdmin(): Promise<{
  user: User;
  supabase: Awaited<ReturnType<typeof createClient>>;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  return !error && isAdmin === true ? { user, supabase } : null;
}

/** For server actions: the admin, or an error that stops the action. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) throw new Error("Not allowed");
  return admin;
}
