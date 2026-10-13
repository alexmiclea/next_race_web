import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/admin/auth-helpers";
import { createClient } from "@/lib/supabase/server";

/** Where the emailed login link lands: turns the one-time code into a login session. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL("/admin/login?error=link", url.origin));
}
