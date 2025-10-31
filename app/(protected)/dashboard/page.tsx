import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.email}
          </p>
        </div>
        <form action="/api/auth/signout" method="post">
          <Button variant="outline">Sign out</Button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Your SaaS boilerplate is ready</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This is your dashboard. Start building your app from here.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>Powered by Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Magic link authentication is set up and working.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
            <CardDescription>Build your features</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Add Stripe subscriptions, AI chat, and custom features.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
