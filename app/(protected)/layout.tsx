import { BottomNav } from '@/components/bottom-nav';
import Link from 'next/link';
import { BookOpen, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between px-6 py-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <Link
          href="/today"
          className="flex items-center gap-2 font-bold text-xl"
        >
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-serif">Daily Bread</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Button variant="ghost" asChild>
            <Link href="/today">Today</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/progress">Progress</Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1 pb-20 md:pb-8">{children}</main>

      <BottomNav />
    </div>
  );
}
