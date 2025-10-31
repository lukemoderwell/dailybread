/**
 * AI Chat Interface Component
 *
 * TODO: Update this component to work with the current version of the AI SDK (v5.x)
 * The API structure has changed. See: https://sdk.vercel.ai/docs
 *
 * For now, this component is commented out. The chat API route is functional.
 */

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ChatInterface() {
  return (
    <Card className="flex h-[600px] flex-col">
      <CardHeader>
        <CardTitle>AI Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">
          Chat interface coming soon. API route is ready at /api/chat
        </p>
        <Button disabled>Start Chat</Button>
      </CardContent>
    </Card>
  );
}
