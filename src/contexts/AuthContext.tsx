import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "admin" | "gym_admin" | "user";

const resolveUserRole = (roles: Array<{ role: string }> | null | undefined): AppRole => {
  const hasAdmin = roles?.some((entry) => entry.role === "admin") ?? false;
  if (hasAdmin) return "admin";
  const hasGymAdmin = roles?.some((entry) => entry.role === "gym_admin") ?? false;
  return hasGymAdmin ? "gym_admin" : "user";
};

export interface UserProfile {
  email: string;
  name: string;
  height?: number;
  weight?: number;
  level?: string;
  goal?: string;
  gymName?: string;
  gymId?: string;
  onboarded?: boolean;
  xp?: number;
  rank?: string;
  streak: number;
  avatarUrl?: string;
  gender?: string;
  dateOfBirth?: string;
  targetWeight?: number;
  primaryMuscle?: string;
  bodyFatPercentage?: number;
  suspended?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  authUser: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isGymAdmin: boolean;
  loading: boolean;
  userRole: string | null;
  // Add this inside AuthContextType
  verifyEmail: (email: string, token: string) => Promise<{ error: string | null }>;
  login: (email: string, password: string) => Promise<{ error: string | null; role: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null; requiresEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGymAdmin, setIsGymAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applyRoleState = useCallback((role: AppRole) => {
    setIsAdmin(role === "admin");
    setIsGymAdmin(role === "gym_admin");
    setUserRole(role);
    return role;
  }, []);

  const clearAuthState = useCallback(() => {
    setSession(null);
    setAuthUser(null);
    setUser(null);
    setIsAdmin(false);
    setIsGymAdmin(false);
    setUserRole(null);
  }, []);

// Replace the fetchProfile function in your AuthContext.tsx with this:

const fetchProfile = useCallback(async (userId: string) => {
  const calculateCurrentStreak = (workoutDates: string[]): number => {
    if (!workoutDates.length) return 0;

    const uniqueDates = Array.from(new Set(workoutDates)).sort((a, b) => (a > b ? -1 : 1));
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < uniqueDates.length; i += 1) {
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().slice(0, 10);

      if (uniqueDates.includes(expectedDateStr)) {
        streak += 1;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
    }

    return streak;
  };

  const [{ data: profileData }, { data: workoutRows }, { data: roles }] = await Promise.all([
    supabase
      .from("profiles")
      .select(`
        *,
        gyms (
          name
        )
      `)
      .eq("user_id", userId)
      .single(),
    supabase
      .from("workouts")
      .select("workout_date")
      .eq("user_id", userId)
      .order("workout_date", { ascending: false }),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);

  if (profileData) {
    const streak = calculateCurrentStreak((workoutRows ?? []).map((row: { workout_date: string }) => row.workout_date));

    setUser({
      email: profileData.email,
      name: profileData.name,
      height: profileData.height ? Number(profileData.height) : undefined,
      weight: profileData.weight ? Number(profileData.weight) : undefined,
      level: profileData.level ?? undefined,
      goal: profileData.goal ?? undefined,
      gymName: (profileData.gyms as any)?.name ?? profileData.gym_name ?? undefined,
      gymId: profileData.gym_id ?? undefined,
      onboarded: profileData.onboarded,
      xp: profileData.xp,
      rank: profileData.rank,
      streak,
      avatarUrl: profileData.avatar_url ?? undefined,
      gender: profileData.gender ?? undefined,
      dateOfBirth: profileData.date_of_birth ?? undefined,
      targetWeight: profileData.target_weight ? Number(profileData.target_weight) : undefined,
      primaryMuscle: profileData.primary_muscle ?? undefined,
      bodyFatPercentage: profileData.body_fat_percentage ? Number(profileData.body_fat_percentage) : undefined,
      suspended: profileData.suspended ?? false,
    });
  }

  return applyRoleState(resolveUserRole(roles));
}, [applyRoleState]);


  const fetchProfileRef = useRef(fetchProfile);
  fetchProfileRef.current = fetchProfile;

  /** True while signInWithPassword + full profile/roles sync runs (blocks duplicate SIGNED_IN). */
  const loginInProgressRef = useRef(false);
  /** Skip redundant SIGNED_IN after login() or getSession() already synced this token. */
  const lastHandledAccessTokenRef = useRef<string | null>(null);

      //here?
    const verifyEmail = useCallback(async (email: string, token: string) => {
  try {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });

    if (error) return { error: error.message };
    
    // Success! The onAuthStateChange listener you already have 
    // will detect the new session and log the user in automatically.
    return { error: null };
  } catch (err: any) {
    return { error: err.message || "An unexpected error occurred" };
  }
}, []);

  useEffect(() => {
    let cancelled = false;

    const syncSession = async (session: Session | null) => {
      if (session?.user) {
        setLoading(true);
      }
      setSession(session);
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfileRef.current(session.user.id);
        lastHandledAccessTokenRef.current = session.access_token ?? null;
      } else {
        clearAuthState();
        lastHandledAccessTokenRef.current = null;
      }
      if (!cancelled) {
        setLoading(false);
      }
    };

    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      await syncSession(session);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;

      if (event === "TOKEN_REFRESHED" && session?.user) {
        setSession(session);
        setAuthUser(session.user);
        lastHandledAccessTokenRef.current = session.access_token ?? null;
        return;
      }

      if (cancelled) return;

      if (event === "SIGNED_IN") {
        if (loginInProgressRef.current) return;
        if (session?.access_token && session.access_token === lastHandledAccessTokenRef.current) return;
      }

      void (async () => {
        if (event === "SIGNED_OUT") {
          setLoading(true);
        }
        await syncSession(session);
      })();
    });



    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [clearAuthState]);

  const login = useCallback(async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
  
    if (error) {
      return { error: error.message, role: null };
    }
  
    const loggedInUser = data?.user;
    const session = data?.session;
  
    if (!loggedInUser || !session) {
      return { error: "Login failed", role: null };
    }
  
    // CHECK IF USER IS SUSPENDED
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("suspended")
      .eq("user_id", loggedInUser.id)
      .single();
  
    if (profileError) {
      return { error: "Could not verify account status", role: null };
    }
  
    if (profile?.suspended) {
      await supabase.auth.signOut();
  
      return {
        error: "Your account has been suspended. Please contact support.",
        role: null,
      };
    }
  
    loginInProgressRef.current = true;
    setLoading(true);
  
    try {
      setSession(session);
      setAuthUser(loggedInUser);
  
      const role = await fetchProfile(loggedInUser.id);
  
      lastHandledAccessTokenRef.current =
        session.access_token ?? null;
  
      return { error: null, role };
    } finally {
      loginInProgressRef.current = false;
      setLoading(false);
    }
  }, [fetchProfile]);


  //for email authentication here 

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin + "/auth/callback",
      },
    });
    return {
      error: error?.message ?? null,
      requiresEmailConfirmation: !data.session,
    };
  }, []);

  const logout = useCallback(async () => {
    const uid = authUser?.id;
    const signOutPromise = supabase.auth.signOut();
    clearAuthState();

    try {
      const { error } = await signOutPromise;
      if (error) console.error("Sign out failed", error);
    } catch (error) {
      console.error("Unexpected sign out error", error);
    }

    if (uid) {
      try {
        await (supabase as any).from("system_logs").insert({ user_id: uid, action: "logout", details: {} });
      } catch {}
    }
  }, [authUser, clearAuthState]);

  const updateProfile = useCallback(
    async (data: Partial<UserProfile>) => {
      if (!authUser) return;
      const updates: Record<string, unknown> = {};
      if (data.name !== undefined) updates.name = data.name;
      if (data.email !== undefined) updates.email = data.email;
      if (data.height !== undefined) updates.height = data.height;
      if (data.weight !== undefined) updates.weight = data.weight;
      if (data.level !== undefined) updates.level = data.level;
      if (data.goal !== undefined) updates.goal = data.goal;
      if (data.gymName !== undefined) updates.gym_name = data.gymName;
      if (data.gymId !== undefined) updates.gym_id = data.gymId;
      if (data.onboarded !== undefined) updates.onboarded = data.onboarded;
      if (data.xp !== undefined) updates.xp = data.xp;
      if (data.rank !== undefined) updates.rank = data.rank;
      if (data.streak !== undefined) updates.streak = data.streak;
      if (data.gender !== undefined) updates.gender = data.gender;
      if (data.dateOfBirth !== undefined) updates.date_of_birth = data.dateOfBirth;
      if (data.targetWeight !== undefined) updates.target_weight = data.targetWeight;
      if (data.primaryMuscle !== undefined) updates.primary_muscle = data.primaryMuscle;
      if (data.bodyFatPercentage !== undefined) updates.body_fat_percentage = data.bodyFatPercentage;

      await supabase.from("profiles").update(updates).eq("user_id", authUser.id);
      // Optimistic local state update for instant UI sync
      setUser(prev => prev ? { ...prev, ...data } : prev);
      try {
        await (supabase as any).from("system_logs").insert({
          user_id: authUser.id,
          action: "profile_update",
          details: { fields: Object.keys(updates) },
        });
      } catch {}
      await fetchProfile(authUser.id);
    },
    [authUser, fetchProfile],
  );

  const refreshProfile = useCallback(async () => {
    if (!authUser) return;
    await fetchProfile(authUser.id);
  }, [authUser, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        user, authUser, session,
        isAuthenticated: !!session,
        isAdmin, isGymAdmin, loading, userRole,
        login, signUp, logout, updateProfile, refreshProfile, verifyEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
