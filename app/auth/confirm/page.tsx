"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ConfirmPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const supabase = createSupabaseBrowserClient();

        console.log("Confirm page - handling auth callback");
        console.log("Full URL:", window.location.href);
        console.log("URL hash:", window.location.hash);
        console.log("URL search:", window.location.search);

        // Check if there's an error in the URL
        const params = new URLSearchParams(window.location.search);
        const errorParam = params.get('error');
        const errorDescription = params.get('error_description');

        if (errorParam) {
          console.error("Auth error from URL:", errorParam, errorDescription);
          setError(errorDescription || errorParam);
          setTimeout(() => router.push('/login'), 3000);
          return;
        }

        // Wait a moment for the hash to be processed by Supabase
        await new Promise(resolve => setTimeout(resolve, 100));

        // The magic link token is in the URL hash fragment
        // Supabase SSR client automatically handles it and sets cookies
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        console.log("Session check:", {
          hasSession: !!session,
          sessionUser: session?.user?.email,
          error: sessionError?.message
        });

        if (sessionError) {
          console.error("Session error:", sessionError);
          setError(sessionError.message);
          setTimeout(() => router.push('/login'), 3000);
          return;
        }

        if (session) {
          console.log("Session established, redirecting to /today");
          // Use replace to avoid back button issues
          router.replace('/today');
        } else {
          console.log("No session found, redirecting to login");
          setError("No session found. Please try again.");
          setTimeout(() => router.push('/login'), 3000);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        {!error ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Confirming your login...</p>
          </>
        ) : (
          <>
            <div className="text-destructive mb-4 text-lg">✗</div>
            <p className="text-destructive mb-2">Authentication failed</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground mt-4">Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
}
