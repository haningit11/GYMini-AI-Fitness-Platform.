import { useState, useEffect, useCallback, useRef } from "react";
import { Dumbbell, ArrowLeft, ArrowRight, Check, Trophy, Flame, Star, Eye, Clock, Weight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ExerciseGifModal from "@/components/workout/ExerciseGifModal";
import WellDoneOverlay from "@/components/workout/WellDoneOverlay";
import RestTimer from "@/components/workout/RestTimer";
import PlanCompletedModal from "@/components/workout/PlanCompletedModal";
import DayCompletedModal from "@/components/workout/DayCompletedModal";
import WorkoutPausedModal from "@/components/workout/WorkoutPausedModal";
import { fetchExerciseVisual, type ExerciseVisual } from "@/lib/exerciseMatch";
import { 
  getRankName,
  XP_PER_SET,
  DAY_COMPLETION_BONUS,
  PLAN_COMPLETION_BONUS
} from "@/lib/xp-logic";

// ===== INTERFACES =====
interface Exercise {
  name: string;
  sets: number;
  reps: string;
}

interface WorkoutDay {
  day: string;
  exercises: Exercise[];
}

interface SetData {
  reps: number;
  weight: number;
}

const defaultWorkout: WorkoutDay[] = [
  {
    day: "Day 1 — Push",
    exercises: [
      { name: "Push-ups", sets: 3, reps: "15" },
      { name: "Dumbbell Press", sets: 3, reps: "12" },
      { name: "Plank", sets: 3, reps: "45s" },
      { name: "Shoulder Taps", sets: 3, reps: "20" },
    ],
  },
];

const REST_OPTIONS = [30, 60, 90] as const;
const DEFAULT_REST = 60;

const BODYWEIGHT_KEYWORDS = [
  "push-up", "pushup", "pull-up", "pullup", "chin-up", "chinup",
  "plank", "sit-up", "situp", "crunch", "burpee", "lunge",
  "squat jump", "jump", "mountain climber", "shoulder tap", "dip",
  "bodyweight", "body weight", "leg raise", "flutter kick",
];

function isBodyweight(name: string): boolean {
  const lower = name.toLowerCase();
  return BODYWEIGHT_KEYWORDS.some((kw) => lower.includes(kw));
}

function buildCompletedMap(exercises: Exercise[]): Record<string, boolean[]> {
  const map: Record<string, boolean[]> = {};
  exercises.forEach((ex) => {
    map[ex.name] = Array(ex.sets).fill(false);
  });
  return map;
}

function buildWeightMap(exercises: Exercise[]): Record<string, number[]> {
  const map: Record<string, number[]> = {};
  exercises.forEach((ex) => {
    map[ex.name] = Array(ex.sets).fill(0);
  });
  return map;
}

function calculateCurrentStreak(workoutDates: string[]): number {
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
}

// ===== CALORIE CALCULATION FUNCTION =====
const calculateCaloriesBurned = (
  completedSetCount: number,
  userWeight: number,
  userLevel: string,
  restDurationSeconds: number,
  setDataArray: SetData[] = []
): number => {
  // Base: 5 calories per set
  const baseCaloriesPerSet = 5;

  // Calculate volume (weight × reps) for all completed sets
  let totalVolume = 0;
  setDataArray.forEach(set => {
    totalVolume += (set.weight * set.reps) || 0;
  });

  // Volume contribution: 0.1 calorie per kg-rep (realistic estimate)
  const volumeCalories = totalVolume * 0.1;

  // User's body weight factor
  const userWeightFactor = Math.max(0.7, Math.min(userWeight / 70, 1.5));

  // Intensity by level
  const intensityMap: Record<string, number> = {
    "Beginner": 1.0,
    "Intermediate": 1.2,
    "Advanced": 1.4,
  };
  const intensityMultiplier = intensityMap[userLevel] || 1.0;

  // Rest period impact
  const restMultiplier = restDurationSeconds < 45 ? 1.1 : 
                         restDurationSeconds < 75 ? 1.0 : 0.95;

  // Total: base + volume, then apply multipliers
  const totalCalories = 
    (baseCaloriesPerSet * completedSetCount + volumeCalories) * 
    userWeightFactor * 
    intensityMultiplier * 
    restMultiplier;

  return Math.round(totalCalories);
};

const WorkoutSession = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, authUser, updateProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [startTime] = useState(Date.now());
  const sessionIdRef = useRef<string | null>(null);
  const estCaloriesRef = useRef<number>(0);  // ←   THIS LINE to store calories
  const sessionCreatePending = useRef(false);
  const [showPausedModal, setShowPausedModal] = useState(false);

  // ===== STATE VARIABLES =====
  
  // Workout structure
  const allDays: WorkoutDay[] = (() => {
    const s = location.state;
    if (s?.allDays) return s.allDays as WorkoutDay[];
    if (s?.workout) return [s.workout as WorkoutDay];
    return defaultWorkout;
  })();

  const initialDayIndex: number = location.state?.dayIndex ?? 0;
  const resumeSessionId: string | undefined = location.state?.resumeSessionId;

  // Navigation
  const [currentDayIndex, setCurrentDayIndex] = useState(initialDayIndex);
  const [currentExIndex, setCurrentExIndex] = useState(0);
  
  // Workout data
  const [completedSets, setCompletedSets] = useState<Record<string, boolean[]>>(() =>
    buildCompletedMap(allDays[initialDayIndex]?.exercises ?? []),
  );
  const [weightInputs, setWeightInputs] = useState<Record<string, number[]>>(() =>
    buildWeightMap(allDays[initialDayIndex]?.exercises ?? []),
  );
  const [sessionLoaded, setSessionLoaded] = useState(!resumeSessionId);
  const [allDaysData, setAllDaysData] = useState<WorkoutDay[]>(allDays);

  const [templateTitle, setTemplateTitle] = useState<string>(
    location.state?.templateTitle ?? allDays[0]?.day ?? "Workout"
  );
  
  // Update when day changes
  useEffect(() => {
    const currentDayName = allDaysData[currentDayIndex]?.day ?? "Workout";
    setTemplateTitle(currentDayName);
  }, [currentDayIndex, allDaysData]);

  // XP tracking
  const [sessionXPEarned, setSessionXPEarned] = useState(0);

  // UI state
  const [gifModalOpen, setGifModalOpen] = useState(false);
  const [gifLoading, setGifLoading] = useState(false);
  const [currentVisual, setCurrentVisual] = useState<ExerciseVisual | null>(null);
  const [visualCache, setVisualCache] = useState<Record<string, ExerciseVisual>>({});
  const [showWellDone, setShowWellDone] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restDuration, setRestDuration] = useState(DEFAULT_REST);
  const [restKey, setRestKey] = useState(0);
  const [showPlanCompleted, setShowPlanCompleted] = useState(false);
  const [showDayCompleted, setShowDayCompleted] = useState(false);
  const [finishedXP, setFinishedXP] = useState(0);
  const [finishedBonusXP, setFinishedBonusXP] = useState(0);

  const currentDay = allDaysData[currentDayIndex];
  const currentExercise = currentDay?.exercises[currentExIndex];

  // ===== CALCULATIONS =====
  const totalSetsAllDays = allDaysData.reduce(
    (sum, day) => sum + day.exercises.reduce((s, ex) => s + ex.sets, 0),
    0,
  );
  const currentDayDoneSets = Object.values(completedSets).flat().filter(Boolean).length;
  const previousDaysTotalSets = allDaysData
    .slice(0, currentDayIndex)
    .reduce((sum, day) => sum + day.exercises.reduce((s, ex) => s + ex.sets, 0), 0);
  const overallDoneSets = previousDaysTotalSets + currentDayDoneSets;
  const progressPercent = totalSetsAllDays > 0
    ? Math.round((overallDoneSets / totalSetsAllDays) * 100)
    : 0;

  const allCurrentDone = completedSets[currentExercise?.name]?.every(Boolean) ?? false;
  const isLastExercise = currentExIndex === (currentDay?.exercises.length ?? 1) - 1;
  const isLastDay = currentDayIndex === allDaysData.length - 1;

  // ===== SESSION INITIALIZATION =====
  
  useEffect(() => {
    if (!authUser) return;

    const syncSession = async () => {
      if (resumeSessionId) {
        // RESUMING AN EXISTING SESSION
        const { data } = await supabase
          .from("active_sessions")
          .select("*")
          .eq("id", resumeSessionId)
          .eq("user_id", authUser.id)
          .single();

        if (data) {
          sessionIdRef.current = data.id;
          const dayIdx = data.current_day_index ?? 0;
          const workoutData = data.workout_data as any;
          const days: WorkoutDay[] = workoutData?.days ?? (workoutData?.exercises ? [workoutData] : defaultWorkout);

          setAllDaysData(days);
          setCurrentDayIndex(dayIdx);

          const dayExercises = days[dayIdx]?.exercises ?? [];
          const freshMap = buildCompletedMap(dayExercises);

          const completed = data.completed_exercises as Record<string, boolean[]> | null;
          if (completed && typeof completed === "object" && !Array.isArray(completed)) {
            for (const [name, sets] of Object.entries(completed)) {
              if (freshMap[name] && Array.isArray(sets)) {
                freshMap[name] = sets.map(Boolean);
              }
            }
          }
          setCompletedSets(freshMap);

          const completedSetCount = Object.values(freshMap)
            .flat()
            .filter(Boolean).length;
          const alreadyEarnedXP = completedSetCount * XP_PER_SET;
          setSessionXPEarned(alreadyEarnedXP);

          const firstIncomplete = dayExercises.findIndex((ex) => !freshMap[ex.name]?.every(Boolean));
          setCurrentExIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
        }
      } else if (!sessionIdRef.current && !sessionCreatePending.current) {
        // CREATING A NEW SESSION
        sessionCreatePending.current = true;
        const { data } = await supabase
          .from("active_sessions")
          .insert({
            user_id: authUser.id,
            workout_data: { days: allDaysData, title: templateTitle } as any,
            current_day_index: currentDayIndex,
            completed_exercises: completedSets as any,
          })
          .select("id")
          .single();

        if (data) sessionIdRef.current = data.id;
      }
      setSessionLoaded(true);
    };

    syncSession();
  }, [authUser]);

  // ===== PERSIST PROGRESS TO DATABASE =====
  
  useEffect(() => {
    if (!sessionIdRef.current || !sessionLoaded) return;

    supabase
      .from("active_sessions")
      .update({
        completed_exercises: completedSets as any,
        current_day_index: currentDayIndex,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionIdRef.current)
      .then(() => {});
  }, [completedSets, currentDayIndex, sessionLoaded]);

  // ===== VISUAL LOADING =====
  
  const loadVisual = useCallback(
    async (name: string) => {
      if (visualCache[name]) {
        setCurrentVisual(visualCache[name]);
        return;
      }
      setGifLoading(true);
      const visual = await fetchExerciseVisual(name);
      setVisualCache((prev) => ({ ...prev, [name]: visual }));
      setCurrentVisual(visual);
      setGifLoading(false);
    },
    [visualCache],
  );

  useEffect(() => {
    if (currentExercise) {
      loadVisual(currentExercise.name);
    }
  }, [currentExercise?.name, loadVisual]);

  const handleShowGif = () => setGifModalOpen(true);

  // ===== COMPLETE A SET =====
  
  const handleToggleSet = async (setIndex: number) => {
    const wasDone = completedSets[currentExercise.name][setIndex];
    
    if (!wasDone) {
      const { error: xpError } = await supabase.rpc("increment_xp", {
        user_id: authUser?.id,
        xp_to_add: XP_PER_SET,
      });
      
      if (!xpError) {
        console.log(`✅ Saved ${XP_PER_SET} XP for completing set ${setIndex + 1}`);
        setSessionXPEarned((prev) => prev + XP_PER_SET);
      } else {
        console.error("Failed to save XP:", xpError);
        toast({
          title: "Warning",
          description: "Could not save XP. Try again.",
          variant: "destructive",
        });
      }
    }
    
    setCompletedSets((prev) => {
      const updated = { ...prev };
      updated[currentExercise.name] = [...updated[currentExercise.name]];
      updated[currentExercise.name][setIndex] = !updated[currentExercise.name][setIndex];
      return updated;
    });

    if (!wasDone) {
      setShowWellDone(true);
      setTimeout(() => setShowWellDone(false), 1800);
      
      const remainingSets = completedSets[currentExercise.name].filter((d, i) => i !== setIndex && !d);
      if (remainingSets.length > 0) {
        setRestKey((k) => k + 1);
        setShowRestTimer(true);
      }
    }
  };

  const handleRestComplete = useCallback(() => {
    setShowRestTimer(false);
  }, []);

  // ===== COMPLETE DAY =====
  
  const completeDay = async () => {
    const isFinalDay = currentDayIndex === allDaysData.length - 1;
    const dayExercises = currentDay?.exercises ?? [];
    const durationMin = Math.round((Date.now() - startTime) / 60000);
    
    // Count actual completed sets
    const completedSetCount = Object.values(completedSets)
      .flat()
      .filter(Boolean).length;

    // ===== COLLECT SET DATA =====
    const setDataArray: SetData[] = [];
    
    dayExercises.forEach((ex) => {
      const weights = weightInputs[ex.name] || Array(ex.sets).fill(0);
      const completedStatus = completedSets[ex.name] || [];
      const repsCount = parseInt(ex.reps) || 0;

      completedStatus.forEach((isDone, idx) => {
        if (isDone) {
          setDataArray.push({
            reps: repsCount,
            weight: weights[idx] ?? 0,
          });
        }
      });
    });
    // ============================

    // Use better calorie calculation
    const estCalories = calculateCaloriesBurned(
      completedSetCount,
      user?.weight ?? 70,
      user?.level ?? "Beginner",
      restDuration,
      setDataArray
    );
    // Save calories to ref so modal can access it
    estCaloriesRef.current = estCalories;

    // Calculate bonuses
    const dayBonus = DAY_COMPLETION_BONUS;
    const planBonus = isFinalDay ? PLAN_COMPLETION_BONUS : 0;
    const totalBonusXP = dayBonus + planBonus;
    const totalSessionXP = sessionXPEarned + totalBonusXP;

    if (authUser) {
      // Step 1: Log the workout
      const { data: workoutRow, error: workoutErr } = await supabase
        .from("workouts")
        .insert([
          {
            user_id: authUser.id,
            type: templateTitle,
            duration: durationMin,
            calories: estCalories,
            exercises: dayExercises as any,
            workout_date: new Date().toISOString().slice(0, 10),
          },
        ])
        .select()
        .single();

      if (!workoutErr && workoutRow) {
        const logEntries = [];
        dayExercises.forEach((ex) => {
          const weights = weightInputs[ex.name] || Array(ex.sets).fill(0);
          const completedStatus = completedSets[ex.name] || [];

          completedStatus.forEach((isDone, idx) => {
            if (isDone) {
              const weight = weights[idx] ?? 0;
              logEntries.push({
                user_id: authUser.id,
                workout_id: workoutRow.id,
                exercise_name: ex.name,
                muscle_group: (ex as any).muscle_group || "Other",
                set_number: idx + 1,
                reps: parseInt(ex.reps) || 0,
                weight_kg: weight,
              });
            }
          });
        });

        if (logEntries.length > 0) {
          await supabase.from("exercise_logs").insert(logEntries);
        }
      }

      // Step 2: Save bonus XP
      if (totalBonusXP > 0) {
        const { error: bonusError } = await supabase.rpc("increment_xp", {
          user_id: authUser.id,
          xp_to_add: totalBonusXP,
        });
        if (bonusError) console.error("Bonus XP error:", bonusError);
      }

      // Step 3: Update streak
      const { data: streakRows } = await supabase
        .from("workouts")
        .select("workout_date")
        .eq("user_id", authUser.id)
        .order("workout_date", { ascending: false });

      const streak = calculateCurrentStreak(
        (streakRows ?? []).map((row: { workout_date: string }) => row.workout_date)
      );
      await supabase.from("profiles").update({ streak }).eq("user_id", authUser.id);

      // Step 4: Fetch fresh XP and update profile
      const { data: freshProfile } = await supabase
        .from("profiles")
        .select("xp")
        .eq("user_id", authUser.id)
        .single();

      const freshXP = freshProfile?.xp ?? sessionXPEarned + totalBonusXP;
      await updateProfile({ xp: freshXP, rank: getRankName(freshXP) });
      await refreshProfile();

      // Step 5: Manage session
      if (sessionIdRef.current) {
        if (isFinalDay) {
          await supabase.from("active_sessions").delete().eq("id", sessionIdRef.current);
          sessionIdRef.current = null;
        } else {
          await supabase
            .from("active_sessions")
            .update({
              current_day_index: currentDayIndex + 1,
              completed_exercises: {} as any,
              updated_at: new Date().toISOString(),
            })
            .eq("id", sessionIdRef.current);
        }
      }

      // Step 6: Show results
      setFinishedXP(totalSessionXP);
      setFinishedBonusXP(totalBonusXP);

      if (isFinalDay) {
        setShowPlanCompleted(true);
      } else {
        setShowDayCompleted(true);
      }
    }
  };

  // ===== MODAL HANDLERS =====
  
  const handlePlanRestart = async () => {
    setShowPlanCompleted(false);
    if (authUser) {
      const { data } = await supabase
        .from("active_sessions")
        .insert({
          user_id: authUser.id,
          workout_data: { days: allDaysData, title: templateTitle } as any,
          current_day_index: 0,
          completed_exercises: buildCompletedMap(allDaysData[0].exercises) as any,
        })
        .select("id")
        .single();
      if (data) {
        navigate("/workout", {
          replace: true,
          state: {
            allDays: allDaysData,
            dayIndex: 0,
            templateTitle,
            resumeSessionId: data.id,
          },
        });
        return;
      }
    }
    navigate("/workout", {
      replace: true,
      state: { allDays: allDaysData, dayIndex: 0, templateTitle },
    });
  };

  const handlePlanGenerateNew = () => {
    setShowPlanCompleted(false);
    navigate("/generator", { replace: true });
  };

  const handlePlanDashboard = () => {
    setShowPlanCompleted(false);
    navigate("/dashboard", {
      replace: true,
      state: { justFinished: true, xpGained: finishedXP },
    });
  };

  const handleDayDashboard = () => {
    setShowDayCompleted(false);
    navigate("/dashboard", {
      replace: true,
      state: { justFinished: true, xpGained: finishedXP },
    });
  };

  const handleNext = async () => {
    if (isLastExercise) {
      await completeDay();
    } else {
      setCurrentExIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentExIndex > 0) setCurrentExIndex((i) => i - 1);
  };

  const handleQuitWorkout = async () => {
    // STEP A: Calculate how many sets were completed
    const completedSetCount = Object.values(completedSets)
      .flat()
      .filter(Boolean).length;  // Count TRUE values
    
    // Example: user did 3 sets
    // completedSetCount = 3
  
    // STEP B: Only log if they actually completed at least 1 set
    if (completedSetCount > 0 && authUser) {
      try {
        // STEP C: Collect set data (weight & reps)
        const setDataArray: SetData[] = [];
        
        const dayExercises = currentDay?.exercises ?? [];
        dayExercises.forEach((ex) => {
          const weights = weightInputs[ex.name] || Array(ex.sets).fill(0);
          const completedStatus = completedSets[ex.name] || [];
          const repsCount = parseInt(ex.reps) || 0;
  
          completedStatus.forEach((isDone, idx) => {
            if (isDone) {
              setDataArray.push({
                reps: repsCount,
                weight: weights[idx] ?? 0,
              });
            }
          });
        });
  
        // STEP D: Calculate calories for partial workout
        const estCalories = calculateCaloriesBurned(
          completedSetCount,
          user?.weight ?? 70,
          user?.level ?? "Beginner",
          restDuration,
          setDataArray
        );
        // Example: 3 sets = 24 calories
  
        // STEP E: Log PARTIAL workout to database
        const { error: workoutErr } = await supabase
          .from("workouts")
          .insert([
            {
              user_id: authUser.id,
              type: templateTitle,
              duration: Math.round((Date.now() - startTime) / 60000),
              calories: estCalories,
              exercises: dayExercises as any,
              workout_date: new Date().toISOString().slice(0, 10),
            },
          ]);
  
        if (workoutErr) {
          console.error("Error logging partial workout:", workoutErr);
          toast({
            title: "Warning",
            description: "Could not save partial workout",
            variant: "destructive",
          });
        } else {
          console.log(`✅ Logged partial workout: ${completedSetCount} sets, ${estCalories} cal`);
        }
      } catch (error) {
        console.error("Error in handleQuitWorkout:", error);
      }
    }
  
    // STEP F: Show the modal (same as before)
    setShowPausedModal(true);
  };

  const handlePausedResume = () => {
    setShowPausedModal(false);
  };
  
  const handlePausedDashboard = () => {
    setShowPausedModal(false);
    navigate("/dashboard");
  };

  if (!sessionLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence>{showWellDone && <WellDoneOverlay show={showWellDone} />}</AnimatePresence>
      
      <PlanCompletedModal
        show={showPlanCompleted}
        xpGained={finishedXP}
        bonusXP={finishedBonusXP}
        templateTitle={templateTitle}
        onRestart={handlePlanRestart}
        onGenerateNew={handlePlanGenerateNew}
        onDashboard={handlePlanDashboard}
      />
      
      <DayCompletedModal
  show={showDayCompleted}
  xpGained={finishedXP}
  bonusXP={finishedBonusXP}
  currentDay={currentDayIndex + 1}
  totalDays={allDaysData.length}
  caloriesBurned={estCaloriesRef.current}  // ← ADD THIS LINE
  onDashboard={handleDayDashboard}
/>
      
      <ExerciseGifModal
        open={gifModalOpen}
        onOpenChange={setGifModalOpen}
        visual={currentVisual}
        loading={gifLoading}
      />

<WorkoutPausedModal
  show={showPausedModal}
  xpEarned={sessionXPEarned}
  caloriesBurned={
    // Calculate calories when modal shows
    (() => {
      const completedSetCount = Object.values(completedSets)
        .flat()
        .filter(Boolean).length;
      if (completedSetCount === 0) return 0;
      
      const setDataArray: SetData[] = [];
      const dayExercises = currentDay?.exercises ?? [];
      dayExercises.forEach((ex) => {
        const weights = weightInputs[ex.name] || Array(ex.sets).fill(0);
        const completedStatus = completedSets[ex.name] || [];
        const repsCount = parseInt(ex.reps) || 0;
        completedStatus.forEach((isDone, idx) => {
          if (isDone) {
            setDataArray.push({
              reps: repsCount,
              weight: weights[idx] ?? 0,
            });
          }
        });
      });
      
      return calculateCaloriesBurned(
        completedSetCount,
        user?.weight ?? 70,
        user?.level ?? "Beginner",
        restDuration,
        setDataArray
      );
    })()
  }
  onResume={handlePausedResume}
  onDashboard={handlePausedDashboard}
/>

      <nav className="bg-card border-b border-border">
        <div className="container mx-auto flex items-center justify-between py-4 px-6">
          <button
            onClick={handleQuitWorkout}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Quit Workout</span>
          </button>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-display">
              <Star className="w-3 h-3 mr-1" /> {sessionXPEarned} XP
            </Badge>
            <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8 max-w-lg">
        {allDaysData.length > 1 && (
          <div className="flex items-center justify-center gap-2 mb-4">
            {allDaysData.map((_, i) => (
              <div
                key={i}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  i < currentDayIndex
                    ? "bg-primary text-primary-foreground"
                    : i === currentDayIndex
                      ? "gradient-hero text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                Day {i + 1}
              </div>
            ))}
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span className="font-medium">{currentDay?.day}</span>
            <span>{progressPercent}% complete</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground mr-1">Rest:</span>
          {REST_OPTIONS.map((sec) => (
            <button
              key={sec}
              onClick={() => setRestDuration(sec)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                restDuration === sec
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {sec}s
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          {currentDay?.exercises.map((_, i) => (
            <div
              key={i}
              className={`w-8 h-1.5 rounded-full transition-colors ${
                i < currentExIndex ? "bg-primary" : i === currentExIndex ? "gradient-hero" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {currentExercise && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentDayIndex}-${currentExercise.name}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="bg-card rounded-2xl p-8 border border-border shadow-card mb-6"
            >
              <div className="text-center mb-6">
                <Badge className="mb-3 gradient-hero text-primary-foreground border-0">
                  Exercise {currentExIndex + 1} of {currentDay.exercises.length}
                </Badge>
                <h2 className="text-2xl font-display font-bold text-foreground">{currentExercise.name}</h2>
                <p className="text-muted-foreground mt-1">
                  {currentExercise.sets} sets × {currentExercise.reps} reps
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={handleShowGif}>
                  <Eye className="w-4 h-4 mr-1" /> View Exercise Guide
                </Button>
              </div>

              <div className="space-y-3">
                {completedSets[currentExercise.name]?.map((done, setIdx) => (
                  <div
                    key={setIdx}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      done ? "bg-primary/10 border-primary" : "bg-muted border-border"
                    }`}
                  >
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleToggleSet(setIdx)}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <Checkbox checked={done} className="pointer-events-none" />
                      <div className="text-left">
                        <span className={`font-semibold text-sm ${done ? "text-primary" : "text-foreground"}`}>
                          Set {setIdx + 1}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">{currentExercise.reps} reps</span>
                      </div>
                    </motion.button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Input
                        type="number"
                        min={0}
                        step="0.5"
                        placeholder={isBodyweight(currentExercise.name) ? "BW" : "kg"}
                        value={weightInputs[currentExercise.name]?.[setIdx] ?? ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                          setWeightInputs((prev) => {
                            const updated = { ...prev };
                            if (!updated[currentExercise.name]) {
                              updated[currentExercise.name] = Array(currentExercise.sets).fill(0);
                            }
                            updated[currentExercise.name][setIdx] = isNaN(val) ? 0 : val;
                            return updated;
                          });
                        }}
                        className="w-16 h-8 text-xs text-center bg-background border-border"
                      />
                      <span className="text-[10px] text-muted-foreground">kg</span>
                    </div>
                    {done && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-xs font-bold text-primary shrink-0"
                      >
                        +{XP_PER_SET} XP
                      </motion.span>
                    )}
                  </div>
                ))}
              </div>

              <RestTimer 
                key={restKey} 
                duration={restDuration} 
                onComplete={handleRestComplete} 
                show={showRestTimer} 
              />
            </motion.div>
          </AnimatePresence>
        )}

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handlePrev} 
            disabled={currentExIndex === 0} 
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={!allCurrentDone}
            className="flex-1 gradient-hero text-primary-foreground border-0 shadow-hero disabled:opacity-50"
          >
            {isLastExercise && isLastDay ? (
              <>
                <Trophy className="w-4 h-4 mr-1" /> Finish Workout
              </>
            ) : isLastExercise ? (
              <>
                <Check className="w-4 h-4 mr-1" /> Finish Day
              </>
            ) : (
              <>
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>

        {!allCurrentDone && (
          <p className="text-center text-xs text-muted-foreground mt-3">Complete all sets to continue</p>
        )}
      </main>
    </div>
  );
};

export default WorkoutSession;