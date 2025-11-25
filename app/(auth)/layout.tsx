import { BookOpen } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        {/* Gradient overlay */}
        <div 
          className="absolute inset-0" 
          style={{
            background: 'linear-gradient(to bottom right, rgba(217, 119, 6, 0.2), rgba(24, 24, 27, 0.4), rgba(24, 24, 27, 0.9))'
          }}
        />
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at top left, rgba(245, 158, 11, 0.15), transparent 60%)'
          }}
        />
        
        <div className="relative z-20 flex items-center text-lg font-medium tracking-tight">
          <BookOpen className="mr-2 h-6 w-6" />
          dailybread
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2 border-l-2 border-white/20 pl-6">
            <p className="text-xl italic leading-relaxed font-(family-name:--font-crimson)">
              &ldquo;Your word is a lamp for my feet, a light on my path.&rdquo;
            </p>
            <footer className="text-sm font-medium opacity-80">
              Psalm 119:105
            </footer>
          </blockquote>
        </div>
      </div>
      <div className="p-4 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[380px]">
          {children}
        </div>
      </div>
    </div>
  );
}
