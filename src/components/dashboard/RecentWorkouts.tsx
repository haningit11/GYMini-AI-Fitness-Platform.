import { useEffect, useState } from "react";
import { Dumbbell, Clock, Flame, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface WorkoutRow {
  id: string;
  type: string;
  duration: number;
  calories: number;
  workout_date: string;
  exercises: unknown;
}

interface ExerciseLogSummary {
  workout_id: string;
  exercise_count: number;
  total_volume: number;
}

const typeColorMap: Record<string, string> = {
  push: "border-l-sky-500",
  pull: "border-l-emerald-500",
  legs: "border-l-orange-500",
  leg: "border-l-orange-500",
  upper: "border-l-sky-500",
  lower: "border-l-orange-500",
  chest: "border-l-sky-500",
  back: "border-l-emerald-500",
  arms: "border-l-violet-500",
  shoulder: "border-l-amber-500",
  core: "border-l-rose-500",
  cardio: "border-l-red-500",
  full: "border-l-primary",
};

function getTypeBorderClass(type: string): string {
  const lower = type.toLowerCase();
  for (const [key, cls] of Object.entries(typeColorMap)) {
    if (lower.includes(key)) return cls;
  }
  return "border-l-primary";
}

interface RecentWorkoutsProps {
  workouts: WorkoutRow[];
  loading: boolean;
}

export const RecentWorkouts = ({ workouts, loading }: RecentWorkoutsProps) => {
  const { authUser } = useAuth();
  const [logSummaries, setLogSummaries] = useState<Record<string, ExerciseLogSummary>>({});

  // Fetch exercise_logs summaries for displayed workouts
  useEffect(() => {
    if (!authUser || workouts.length === 0) return;
    const ids = workouts.map((w) => w.id);
    supabase
      .from("exercise_logs")
      .select("workout_id, exercise_name, weight_kg, reps")
      .eq("user_id", authUser.id)
      .in("workout_id", ids)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, { exercises: Set<string>; volume: number }> = {};
        data.forEach((row) => {
          if (!map[row.workout_id]) map[row.workout_id] = { exercises: new Set(), volume: 0 };
          map[row.workout_id].exercises.add(row.exercise_name);
          map[row.workout_id].volume += (Number(row.weight_kg) || 0) * (row.reps || 0);
        });
        const summaries: Record<string, ExerciseLogSummary> = {};
        for (const [wid, val] of Object.entries(map)) {
          summaries[wid] = { workout_id: wid, exercise_count: val.exercises.size, total_volume: val.volume };
        }
        setLogSummaries(summaries);
      });
  }, [authUser, workouts]);

  const displayWorkouts = workouts.slice(0, 5);
  const hasMore = workouts.length > 3;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-display font-bold text-muted-foreground uppercase tracking-wider">
          Recent Workouts
        </h3>
        {hasMore && (
          <Link to="/saved-plans" className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline">
            View All <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : workouts.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <Dumbbell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No workouts yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Generate a workout and complete it to see your history here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayWorkouts.map((w) => {
            const summary = logSummaries[w.id];
            const borderCls = getTypeBorderClass(w.type);
            return (
              <div
                key={w.id}
                className={`bg-card rounded-xl border border-border border-l-4 ${borderCls} p-3 flex items-center gap-3 shadow-card`}
              >
                <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center shrink-0">
                  <Dumbbell className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-foreground text-sm truncate">{w.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(w.workout_date), "MMM d, yyyy")}
                    {summary && ` · ${summary.exercise_count} exercises`}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {w.duration}m
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    {w.calories}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
