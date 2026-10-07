import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasAuthCookie } from "@/lib/admin/auth-helpers";

/**
 * Keeps the admin's login fresh: Supabase login tokens expire after an hour and are
 * renewed here, because pages themselves can't write cookies. Visitors without a login
 * cookie (everyone but the admin) skip this entirely, so it costs them nothing.
 */
export async function proxy(request: NextRequest) {
  if (!hasAuthCookie(request.cookies.getAll().map((cookie) => cookie.name))) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );
  // Renews the session if needed (and clears it if it's no longer valid).
  await supabase.auth.getUser();
  return response;
}

export const config = {
  // Every page, but not static files and images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
