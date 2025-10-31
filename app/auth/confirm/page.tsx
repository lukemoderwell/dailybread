"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ConfirmPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const handleAuth = async () => {
      console.log("Confirm page - checking auth");

      // Check if we have a session
      const { data: { session }, error } = await supabase.auth.getSession();

      console.log("Session check:", { hasSession: !!session, error: error?.message });

      if (session) {
        // Store session in cookies via API route
        const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }),
        });

        if (response.ok) {
          router.push('/today');
        } else {
          console.error('Failed to store session');
          router.push('/login');
        }
      } else {
        console.log("No session found, redirecting to login");
        router.push('/login');
      }
    };

    handleAuth();
  }, [router, supabase]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Confirming your login...</p>
      </div>
    </div>
  );
}
