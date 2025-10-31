"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}

export function UserProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: User | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, isLoading, signOut }}>
      {children}
    </UserContext.Provider>
  );
}
