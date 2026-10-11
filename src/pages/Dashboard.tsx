import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { MessageSquareQuote, CheckCircle2, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { RankUpCelebration } from "@/components/RankUpCelebration";
import { getRankProgress } from "@/lib/xp-logic";

import { IdentityHeader } from "@/components/dashboard/IdentityHeader";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { StatsSidebar } from "@/components/dashboard/StatsSidebar";
import { RecentWorkouts } from "@/components/dashboard/RecentWorkouts";
import { ActiveWorkoutCard } from "@/components/dashboard/ActiveWorkoutCard";
import { getRankName } from "@/lib/xp-logic";
import { useToast } from "@/hooks/use-toast";

const motivationalQuotes = [
  "Consistency builds strength!",
  "The only bad workout is the one that didn't happen.",
  "You're one workout away from a good mood!",
  "Small steps lead to big results. Keep going!",
];

interface WorkoutRow {
  id: string;
  type: string;
  duration: number;
  calories: number;
  workout_date: string;
  exercises: unknown;
}

const Dashboard = () => {
  const [quote] = useState(() => motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  const { user, authUser, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [workouts, setWorkouts] = useState<WorkoutRow[]>([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(true);
  const [showRankUp, setShowRankUp] = useState(false);
  const [rankUpName, setRankUpName] = useState("");
  const prevRankRef = useRef<string | null>(null);

  // Celebration on workout finish — clear state immediately to prevent duplicate toasts on refresh
  useEffect(() => {
    const state = location.state as { justFinished?: boolean; xpGained?: number } | null;
    if (state?.justFinished) {
      // Clear navigation state FIRST so a page refresh won't re-trigger
      window.history.replaceState({}, document.title);

      toast({
        title: "Workout Complete!",
        description: `+${state.xpGained || 0} XP Gained`,
      });

      const currentRank = getRankName(user?.xp || 0);
      if (prevRankRef.current && prevRankRef.current !== currentRank) {
        setRankUpName(currentRank);
        setShowRankUp(true);
      }
    }
  }, [location.state, user?.xp, toast]);

  // Load recent workouts
  useEffect(() => {
    if (!authUser) return;

    supabase
      .from("workouts")
      .select("*")
      .eq("user_id", authUser.id)
      .order("workout_date", { ascending: false })
      .limit(10)
      .then(({ data, error }) => {
        if (error) {
          console.error("Error loading workouts:", error);
          setWorkouts([]);
        } else {
          setWorkouts((data as WorkoutRow[]) || []);
        }
        setLoadingWorkouts(false);
      });
  }, [authUser]);

  // Rank-up detection using localStorage for cross-tab persistence
  useEffect(() => {
    if (!user?.rank || !authUser) return;

    const currentRank = getRankProgress(user.xp || 0).current.name;
    const storageKey = `gymini_last_rank_${authUser.id}`;
    const lastSeenRank = localStorage.getItem(storageKey);

    if (!prevRankRef.current) {
      prevRankRef.current = lastSeenRank || currentRank;
    }

    if (lastSeenRank && lastSeenRank !== currentRank) {
      prevRankRef.current = lastSeenRank;
      setRankUpName(currentRank);
      setShowRankUp(true);
    }

    localStorage.setItem(storageKey, currentRank);
  }, [user?.xp, user?.rank, authUser]);

  const totalWorkouts = workouts.length;
  const totalCalories = workouts.reduce((sum, w) => sum + w.calories, 0);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const hasWorkoutToday = workouts.some((w) => w.workout_date === todayStr);

  const handleRankUpComplete = useCallback(() => setShowRankUp(false), []);

  return (
    <div className="min-h-screen bg-background">
      <RankUpCelebration show={showRankUp} newRank={rankUpName} onComplete={handleRankUpComplete} />

      <div className="container mx-auto px-4 md:px-8 py-8 max-w-6xl">
        {/* Header: Identity + Quote */}
        <div className="mb-8 space-y-3">
          <IdentityHeader
            avatarUrl={user?.avatarUrl}
            name={user?.name}
            xp={user?.xp || 0}
            rank={user?.rank || "Rookie"}
            streak={user?.streak || 0}
            gymName={user?.gymName}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="flex items-start gap-2 ml-2"
          >
            <MessageSquareQuote className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground italic">{quote}</p>
          </motion.div>
        </div>

        {/* Main Layout: Sidebar + Content */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-8">
       {/* Main Column */}
<div className="space-y-6">
  {/* ONLY render the card if we actually have a logged-in user ID ready */}
  {authUser?.id ? (
    <ActiveWorkoutCard />
  ) : (
    <div className="h-20 animate-pulse bg-muted rounded-2xl" /> // Optional loading skeleton
  )}

  {/* Today's Achievement */}
  {hasWorkoutToday && (
    // ... rest of your code
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 shadow-card"
              >
                <div className="flex items-center gap-1.5 shrink-0">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-sm text-foreground font-medium">
                  You crushed it today! Rest up and come back tomorrow to continue your program.
                </p>
              </motion.div>
            )}

            {/* Quick Actions - Generate, Import, Browse */}
            <QuickActions />

            {/* Recent Workouts - List of past workouts */}
            <RecentWorkouts workouts={workouts} loading={loadingWorkouts} />
          </div>

          {/* Right Sidebar: Stats (Hidden on mobile) */}
          <div className="hidden md:block">
            <StatsSidebar
              totalWorkouts={totalWorkouts}
              totalCalories={totalCalories}
              xp={user?.xp || 0}
              rank={user?.rank || "Rookie"}
              workouts={workouts}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;