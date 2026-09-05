import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  // /login/mfa is deliberately excluded from isAuthRoute — an aal1 user
  // mid-challenge must be able to stay on it, not get bounced back to
  // /home by the isAuthRoute redirect below.
  const isAuthRoute = (pathname.startsWith("/login") && pathname !== "/login/mfa") || pathname.startsWith("/signup");
  const isOnboardingRoute = pathname.startsWith("/onboarding");
  const isPublicRoute =
    pathname.startsWith("/card/") ||
    pathname.startsWith("/compare/") ||
    pathname.startsWith("/topic/") ||
    pathname.startsWith("/hashtag/") ||
    pathname.startsWith("/auth/");

  if (!user && !isAuthRoute && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // A password sign-in only reaches aal1. If the account has a verified
  // MFA factor, GoTrue's own assurance-level check says the session needs
  // an aal2 step — send it to the challenge screen before it can reach
  // anything else. /login/mfa itself and the public routes above are
  // exempt so the challenge page (and card/compare/topic/hashtag, which
  // never require a session at all) stay reachable.
  if (user && pathname !== "/login/mfa" && !isPublicRoute) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      return NextResponse.redirect(new URL("/login/mfa", request.url));
    }
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  if (user && !isOnboardingRoute && !isAuthRoute && !isPublicRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("id", user.id)
      .single();

    if (profile && !profile.onboarding_completed_at) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.webmanifest).*)"],
};
