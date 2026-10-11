import { useEffect, useState, useCallback } from "react";
import { Play, Dumbbell, X } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ActiveSession {
  id: string;
  workout_data: any;
  current_day_index: number;
  completed_exercises: any;
  started_at: string;
}

export const ActiveWorkoutCard = () => {
  const { authUser } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch active session
  const fetchSession = useCallback(() => {
    if (!authUser) {
      setLoading(false);
      return;
    }

    supabase
      .from("active_sessions")
      .select("*")
      .eq("user_id", authUser.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching active session:", error);
          setSession(null);
        } else {
          setSession(data && data.length > 0 ? (data[0] as ActiveSession) : null);
        }
        setLoading(false);
      });
  }, [authUser]);

  // Initial fetch
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Realtime subscription: listen for changes to active_sessions
  useEffect(() => {
    if (!authUser) return;

    const channel = supabase
      .channel(`active-session-${authUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "active_sessions",
          filter: `user_id=eq.${authUser.id}`,
        },
        () => {
          // Re-fetch whenever there's a change
          fetchSession();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authUser, fetchSession]);

  // If no session, don't show anything
  if (loading) {
    return null;
  }

  if (!session) {
    return null;
  }

  const workout = session.workout_data;
  const title = workout?.title || workout?.day || "Workout in Progress";
  const days = workout?.days || (workout?.exercises ? [workout] : []);
  const dayIndex = session.current_day_index ?? 0;
  const currentDay = days[dayIndex];

  // ── Multi-day progress: count sets across ALL days ──
  const totalSets = days.reduce(
    (sum: number, d: any) => sum + (d.exercises?.reduce((s: number, ex: any) => s + (ex.sets || 0), 0) ?? 0),
    0,
  );

  const previousDaysSets = days
    .slice(0, dayIndex)
    .reduce(
      (sum: number, d: any) => sum + (d.exercises?.reduce((s: number, ex: any) => s + (ex.sets || 0), 0) ?? 0),
      0,
    );

  const completed = session.completed_exercises;
  let currentDayDone = 0;
  if (completed && typeof completed === "object" && !Array.isArray(completed)) {
    for (const sets of Object.values(completed)) {
      if (Array.isArray(sets)) {
        currentDayDone += (sets as boolean[]).filter(Boolean).length;
      }
    }
  }

  const overallDone = previousDaysSets + currentDayDone;
  const percent = totalSets > 0 ? Math.round((overallDone / totalSets) * 100) : 0;

  // Exercise preview
  const exerciseNames: string[] = [];
  if (currentDay?.exercises) {
    currentDay.exercises.slice(0, 4).forEach((ex: any) => exerciseNames.push(ex.name || ex.exercise));
  }

  const handleResume = () => {
    navigate("/workout", { state: { resumeSessionId: session.id } });
  };

  const handleDiscard = async () => {
    try {
      await supabase.from("active_sessions").delete().eq("id", session.id);
      setSession(null);
    } catch (error) {
      console.error("Error discarding session:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="relative bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl border-2 border-primary/40 shadow-card p-5 mb-6 overflow-hidden"
    >
      {/* Pulsing glow border effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl border-2 border-primary/30 pointer-events-none"
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10">
        {/* Header with dismiss button */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <motion.div
              className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shrink-0"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-foreground text-sm truncate">{title}</p>
              <p className="text-xs text-muted-foreground">
                {days.length > 1 && `Day ${dayIndex + 1}/${days.length} · `}
                {percent}% complete · {overallDone}/{totalSets} sets
              </p>
            </div>
          </div>
          <button
            onClick={handleDiscard}
            className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
            title="Discard this workout"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Exercise names */}
        {exerciseNames.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {exerciseNames.map((name) => (
              <span
                key={name}
                className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium"
              >
                {name}
              </span>
            ))}
            {currentDay?.exercises?.length > 4 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                +{currentDay.exercises.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Progress bar */}
        <Progress value={percent} className="h-2 mb-3" />

        {/* Resume button */}
        <Button
          onClick={handleResume}
          className="w-full gradient-hero text-primary-foreground border-0 shadow-hero hover:shadow-lg transition-all"
        >
          <Play className="w-4 h-4 mr-1" /> Resume Workout
        </Button>
      </div>
    </motion.div>
  );
};