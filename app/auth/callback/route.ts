import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  console.log('Auth callback params:', {
    hasCode: !!code,
    hasTokenHash: !!token_hash,
    type,
    allParams: Object.fromEntries(requestUrl.searchParams.entries())
  });

  // Handle PKCE flow (code)
  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    console.log('Exchange code result:', {
      hasSession: !!data.session,
      error: error?.message
    });

    if (!error && data.session) {
      const response = NextResponse.redirect(`${origin}/today`);
      response.cookies.set('sb-access-token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
      });
      response.cookies.set('sb-refresh-token', data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
      });
      console.log('Redirecting to /today with session');
      return response;
    }
  }

  // Handle token hash flow (magiclink/email verification)
  if (token_hash && type) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'email' | 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change',
    });

    console.log('Verify OTP result:', {
      hasSession: !!data.session,
      error: error?.message
    });

    if (!error && data.session) {
      const response = NextResponse.redirect(`${origin}/today`);
      response.cookies.set('sb-access-token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
      });
      response.cookies.set('sb-refresh-token', data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
      });
      console.log('Redirecting to /today with session from token hash');
      return response;
    } else {
      console.log('Token hash verification failed:', error?.message);
    }
  }

  console.log('No valid auth params, redirecting to login');
  return NextResponse.redirect(`${origin}/login`);
}
