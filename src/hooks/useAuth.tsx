import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: string[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; mfaRequired: boolean }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isAnalyst: boolean;
  hasMfa: boolean;
  mfaVerified: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMfa, setHasMfa] = useState(false);
  const [mfaVerified, setMfaVerified] = useState(false);

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    setRoles(data?.map((r: any) => r.role) ?? []);
  };

  const checkMfaStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) return;
      const verifiedFactors = data.totp.filter((f) => f.status === "verified");
      setHasMfa(verifiedFactors.length > 0);
    } catch {
      // ignore
    }
  };

  const checkMfaVerified = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) return;
      setMfaVerified(
        data.currentLevel === "aal2" || data.nextLevel === "aal1"
      );
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchRoles(session.user.id), 0);
          setTimeout(() => { checkMfaStatus(); checkMfaVerified(); }, 0);
        } else {
          setRoles([]);
          setHasMfa(false);
          setMfaVerified(false);
        }
      }
    );

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchRoles(session.user.id);
          await checkMfaStatus();
          await checkMfaVerified();
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error as Error, mfaRequired: false };

    // Check if MFA is required after sign in
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const mfaRequired = aalData?.nextLevel === "aal2" && aalData?.currentLevel === "aal1";

    return { error: null, mfaRequired };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
    setHasMfa(false);
    setMfaVerified(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        roles,
        loading,
        signIn,
        signOut,
        isAdmin: roles.includes("admin"),
        isAnalyst: roles.includes("analyst"),
        hasMfa,
        mfaVerified,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
