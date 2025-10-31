'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createSupabaseBrowserClient();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Sending OTP to:', email);
      console.log('Redirect URL:', `${window.location.origin}/auth/confirm`);

      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });

      console.log('OTP response:', { data, error: error?.message });

      if (error) {
        toast.error(error.message);
        console.error('OTP error:', error);
      } else {
        toast.success('Check your email for the magic link!');
        setEmail('');
      }
    } catch (error) {
      console.error('Caught error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>dailybread</CardTitle>
          <CardDescription>
            Sign in with your email to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send magic link'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
