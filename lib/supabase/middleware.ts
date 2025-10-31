import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  });

  // Check for session tokens in cookies
  const accessToken = request.cookies.get('sb-access-token')?.value;
  const refreshToken = request.cookies.get('sb-refresh-token')?.value;

  // User is authenticated if they have both tokens
  const user = accessToken && refreshToken;

  // Protected routes
  const protectedPaths = ["/dashboard", "/settings"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Auth routes (redirect if already logged in)
  const authPaths = ["/login"];
  const isAuthPath = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Redirect to login if accessing protected route without auth
  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if accessing auth route while logged in
  if (user && isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
