import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public paths that never need auth or active checks
  const isPublicPath =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/suspended");

  if (user && isPublicPath) {
    const { data: profile } = await supabase
      .from("Profile")
      .select("isActive, role")
      .eq("id", user.id)
      .single();

    if (profile?.isActive !== false) {
      // don't redirect suspended users
      if (profile?.role === "ADMIN") {
        const url = request.nextUrl.clone();
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      }
      // Optional: redirect regular logged-in users away from /login and /signup
      if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }
  }

  // Redirect unauthenticated users away from protected routes
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Check isActive for authenticated users on protected routes
  if (user && !isPublicPath) {
    const { data: profile } = await supabase
      .from("Profile")
      .select("isActive, role")
      .eq("id", user.id)
      .single();

    // Suspended user — sign them out and redirect to /suspended
    if (profile && profile.isActive === false) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/suspended";
      return NextResponse.redirect(url);
    }

    // Non-admin trying to access /admin
    if (pathname.startsWith("/admin") && profile?.role !== "ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
