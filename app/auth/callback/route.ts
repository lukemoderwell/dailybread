import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  console.log('Auth callback params:', {
    hasCode: !!code,
    allParams: Object.fromEntries(requestUrl.searchParams.entries())
  });

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    console.log('Exchange code result:', {
      hasSession: !!data.session,
      error: error?.message
    });

    if (!error && data.session) {
      console.log('Redirecting to /today with session');
      return NextResponse.redirect(`${origin}/today`);
    } else {
      console.error('Failed to exchange code:', error?.message);
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }
  }

  console.log('No valid auth params, redirecting to login');
  return NextResponse.redirect(`${origin}/login`);
}
