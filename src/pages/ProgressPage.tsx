import { useState, useEffect, useMemo, useCallback } from "react";
import { Dumbbell } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfWeek, subDays, parseISO, isSameDay } from "date-fns";

import VitalStatsBar from "@/components/progress/VitalStatsBar";
import ProgressCharts from "@/components/progress/ProgressCharts";
import LogMetricsDialog from "@/components/progress/LogMetricsDialog";
import BMICard from "@/components/progress/BMICard";
import MilestoneBadges from "@/components/progress/MilestoneBadges";
import AIInsightsCard from "@/components/progress/AIInsightsCard";

const ProgressPage = () => {
  const { authUser, user: profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const [wRes, eRes, mRes] = await Promise.all([
        supabase.from("workouts").select("*").eq("user_id", authUser.id).order("workout_date", { ascending: true }),
        supabase.from("exercise_logs").select("*").eq("user_id", authUser.id).order("logged_at", { ascending: true }),
        supabase.from("body_measurements").select("*").eq("user_id", authUser.id).order("measured_at", { ascending: true }),
      ]);
      setWorkouts(wRes.data ?? []);
      setExerciseLogs(eRes.data ?? []);
      setMeasurements(mRes.data ?? []);
    } catch (error) {
      console.error("Error fetching progress data:", error);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => { fetchData(); }, [fetchData, refreshKey]);

  const totalVolume = useMemo(() =>
    exerciseLogs.reduce((sum, l) => sum + ((l.weight_kg || 0) * (l.reps || 0)), 0), [exerciseLogs]);

  const currentWeight = profile?.weight ?? (measurements.length ? measurements[measurements.length - 1].weight : null);
  const startWeight = measurements.length ? measurements[0].weight : profile?.weight;

  const streak = useMemo(() => {
    if (!workouts.length) return 0;
    const uniqueDates = [...new Set(workouts.map((w: any) => w.workout_date))].sort().reverse();
    let count = 0;
    let check = new Date();
    
    // Normalize to YYYY-MM-DD for comparison
    const toDateStr = (d: Date) => d.toISOString().split('T')[0];
    
    let checkStr = toDateStr(check);
    if (!uniqueDates.includes(checkStr)) {
      check = subDays(check, 1);
      checkStr = toDateStr(check);
      if (!uniqueDates.includes(checkStr)) return 0;
    }
    
    while (uniqueDates.includes(checkStr)) { 
      count++; 
      check = subDays(check, 1); 
      checkStr = toDateStr(check);
    }
    return count;
  }, [workouts]);

  // Fix Weight Data: Ensure all historical points are included and sorted
  // Fix Weight Data: Ensure onboarding weight is the starting point
const weightData = useMemo(() => {
  const dataMap = new Map<string, number>();
  
  // 1. Initial profile weight (from Onboarding)
  // We use profile.weight and try to find a valid starting date
  const rawProfile = profile as any;
  const onboardingWeight = Number(profile?.weight);
  
  if (onboardingWeight > 0) {
    // Priority: created_at -> first workout date -> today
    const rawDate = rawProfile?.created_at || rawProfile?.inserted_at || workouts[0]?.workout_date || new Date().toISOString();
    const startDate = rawDate.split('T')[0];
    
    dataMap.set(startDate, onboardingWeight);
  }
  
  // 2. Add historical measurements (these will override if on the same day)
  measurements.forEach((m: any) => {
    if (m.weight) {
      const date = m.measured_at.split('T')[0];
      dataMap.set(date, Number(m.weight)); //aca override the weight if the date is the same
    }
  });

  // Convert map to sorted array for the chart
  return Array.from(dataMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, weight]) => ({ date, weight }));
}, [measurements, profile, workouts]);
  // Fix Energy Data: Daily historical view
  const energyData = useMemo(() => {
    const dataMap = new Map<string, number>();
    
    workouts.forEach((w: any) => {
      if (w.workout_date) {
        const date = w.workout_date; // already YYYY-MM-DD
        const current = dataMap.get(date) || 0;
        dataMap.set(date, current + (w.calories || 0));
      }
    });

    return Array.from(dataMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, calories]) => ({ week: date, calories })); // 'week' is used as dataKey in ProgressCharts
  }, [workouts]);
  
   // Strength Data: Max weight per day for ALL exercises logged
   const strengthData = useMemo(() => {
    const dataMap = new Map<string, Record<string, number>>();
    const exerciseSet = new Set<string>();
  
    // 1. Group all logs by DATE only (ignoring time)
    exerciseLogs.forEach((l: any) => {
      if (!l.logged_at || !l.exercise_name) return;
  
      // Use split(' ')[0] or split('T')[0] to get strictly YYYY-MM-DD
      const date = l.logged_at.includes('T') 
        ? l.logged_at.split('T')[0] 
        : l.logged_at.split(' ')[0];
        
      const name = l.exercise_name.trim();
      const weight = parseFloat(l.weight_kg) || 0;
  
      // We only care about exercises where weight was actually pushed
      if (weight > 0) {
        exerciseSet.add(name);
        
        if (!dataMap.has(date)) {
          dataMap.set(date, {});
        }
  
        const dayData = dataMap.get(date)!;
        // Store the highest weight (PR) for that exercise on that day
        if (dayData[name] === undefined || weight > dayData[name]) {
          dayData[name] = weight;
        }
      }
    });
  
    const allExercises = Array.from(exerciseSet);
  
    // 2. Generate the final array, ensuring EVERY date has EVERY exercise key
    // This prevents the "missing line" or "vanishing data" issue in Recharts
    return Array.from(dataMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, exercises]) => {
        const fullDay: any = { date };
        allExercises.forEach((ex) => {
          // If the exercise wasn't done this day, set to null so the line breaks 
          // or use connectNulls in the Chart component
          fullDay[ex] = exercises[ex] ?? null;
        });
        return fullDay;
      });
  }, [exerciseLogs]);

  const { thisWeekVolume, lastWeekVolume } = useMemo(() => {
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = subDays(thisWeekStart, 7);
    let tw = 0, lw = 0;
    
    exerciseLogs.forEach((l: any) => {
      const d = parseISO(l.logged_at);
      const vol = (l.weight_kg || 0) * (l.reps || 0);
      if (d >= thisWeekStart) tw += vol;
      else if (d >= lastWeekStart && d < thisWeekStart) lw += vol;
    });
    return { thisWeekVolume: tw, lastWeekVolume: lw };
  }, [exerciseLogs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Dumbbell className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Progress</h1>
            {authUser && (
              <LogMetricsDialog
                userId={authUser.id}
                onLogged={() => setRefreshKey((k) => k + 1)}
                latestWeight={measurements.length ? measurements[measurements.length - 1].weight : profile?.weight}
                latestBodyFat={measurements.length ? measurements[measurements.length - 1].body_fat_percentage : profile?.bodyFatPercentage}
                latestWaist={measurements.length ? measurements[measurements.length - 1].waist_cm : null}
              />
            )}
          </div>

          <VitalStatsBar
            currentWeight={currentWeight}
            startWeight={startWeight}
            totalWorkouts={workouts.length}
            totalVolume={totalVolume}
            xp={profile?.xp ?? 0}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <ProgressCharts weightData={weightData} energyData={energyData} strengthData={strengthData} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BMICard weight={currentWeight} height={profile?.height ?? null} />
          <AIInsightsCard
            name={profile?.name ?? ""}
            thisWeekVolume={thisWeekVolume}
            lastWeekVolume={lastWeekVolume}
            xp={profile?.xp ?? 0}
            totalWorkouts={workouts.length}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <MilestoneBadges totalVolume={totalVolume} streak={streak} totalWorkouts={workouts.length} xp={profile?.xp ?? 0} />
        </motion.div>
      </main>
    </div>
  );
};

export default ProgressPage;