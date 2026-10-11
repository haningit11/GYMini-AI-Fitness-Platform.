import { useEffect, useState, useMemo } from "react";
import { Dumbbell, ArrowLeft, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DateFilter from "@/components/analytics/DateFilter";
import VolumeChart from "@/components/analytics/VolumeChart";
import MuscleRadar from "@/components/analytics/MuscleRadar";
import WeekHeatmap from "@/components/analytics/WeekHeatmap";
import AIInsights from "@/components/analytics/AIInsights";

interface WorkoutRow {
  id: string;
  type: string;
  duration: number;
  calories: number;
  workout_date: string;
  exercises: unknown;
}


// Keywords for each muscle group - uses .includes() matching
const muscleGroupKeywords: Record<string, string[]> = {
  Chest: ["press", "chest", "fly", "pec", "pectoral", "push-up", "pushup"],
  Back: ["row", "pull", "deadlift", "lat", "lats", "pulldown"],
  Legs: ["squat", "leg", "lunge", "calf", "glute", "hamstring", "quad", "split"],
  Arms: ["curl", "bicep", "tricep", "triceps", "arm"],
  Shoulders: ["shoulder", "press", "raise", "lateral"],
  Core: ["plank", "crunch", "core", "abs", "abdominal", "twist"],
};
 
const getMuscleGroup = (exerciseName: string): string => {
  const name = exerciseName.toLowerCase();
  
  for (const [group, keywords] of Object.entries(muscleGroupKeywords)) {
    if (keywords.some((kw) => name.includes(kw))) {
      return group;
    }
  }
  
  return "Other";
};

const Analytics = () => {
  const { authUser } = useAuth();
  const [allWorkouts, setAllWorkouts] = useState<WorkoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30");

  useEffect(() => {
    if (!authUser) return;
    supabase
      .from("workouts")
      .select("*")
      .eq("user_id", authUser.id)
      .order("workout_date", { ascending: true })
      .then(({ data }) => {
        setAllWorkouts((data as WorkoutRow[]) || []);
        setLoading(false);
      });
  }, [authUser]);

  const workouts = useMemo(() => {
    if (range === "all") return allWorkouts;
    const days = parseInt(range);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return allWorkouts.filter((w) => new Date(w.workout_date) >= cutoff);
  }, [allWorkouts, range]);

  const barData = useMemo(() => {
    const vol = workouts.reduce<Record<string, { date: string; duration: number; calories: number }>>((acc, w) => {
      const date = w.workout_date;
      if (!acc[date]) acc[date] = { date, duration: 0, calories: 0 };
      acc[date].duration += w.duration;
      acc[date].calories += w.calories;
      return acc;
    }, {});
    return Object.values(vol);
  }, [workouts]);

  const muscleGroupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    workouts.forEach((w) => {
      if (Array.isArray(w.exercises)) {
        (w.exercises as Array<{ name?: string }>).forEach((ex) => {
          if (ex.name) {
            const group = getMuscleGroup(ex.name);
            counts[group] = (counts[group] || 0) + 1;
          }
        });
      }
    });
    return counts;
  }, [workouts]);

  const radarData = useMemo(
    () => Object.entries(muscleGroupCounts).map(([name, value]) => ({ name, value })),
    [muscleGroupCounts]
  );

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto flex items-center justify-between py-4 px-6">
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">GYMini</span>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-10 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center shadow-hero">
                <BarChart3 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">Analytics</h1>
                <p className="text-muted-foreground text-sm">Visualize your training data</p>
              </div>
            </div>
            <DateFilter value={range} onChange={setRange} />
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : allWorkouts.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-card">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-display font-bold text-foreground mb-1">No workout data yet</p>
              <p className="text-sm text-muted-foreground">Complete some workouts to see your analytics here.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <VolumeChart data={barData} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <MuscleRadar data={radarData} />
                <WeekHeatmap workouts={workouts} />
              </div>
              <AIInsights workouts={workouts} muscleGroupCounts={muscleGroupCounts} />
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Analytics;
