import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export type AuthValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  displayName: string | null;
  avatarUrl: string | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthValue>(() => {
    const user = session?.user ?? null;
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const name =
      (typeof meta["full_name"] === "string" && meta["full_name"]) ||
      (typeof meta["name"] === "string" && meta["name"]) ||
      user?.email?.split("@")[0] ||
      null;
    const avatar =
      (typeof meta["avatar_url"] === "string" && meta["avatar_url"]) ||
      (typeof meta["picture"] === "string" && meta["picture"]) ||
      null;

    return {
      session,
      user,
      loading,
      displayName: name,
      avatarUrl: avatar,
      signOut: async () => {
        await supabase.auth.signOut();
        setSession(null);
      },
    };
  }, [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
