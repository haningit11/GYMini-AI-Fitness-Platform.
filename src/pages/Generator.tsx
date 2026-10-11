import { useState, useEffect } from "react";
import { Dumbbell, Zap, Loader2, ArrowLeft, FileText, AlertTriangle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { saveWorkoutTemplate } from "@/lib/saveTemplate";
import ProfileStats from "@/components/generator/ProfileStats";
import OptionalDetails from "@/components/generator/OptionalDetails";
import WorkoutResult, { type WorkoutPlan, type WorkoutDay } from "@/components/generator/WorkoutResult";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const levels = ["Beginner", "Intermediate", "Advanced"];
const goals = ["Bulking", "Cutting", "Maintenance"];
const INJURY_KEYWORDS = /injur|hurt|pain|sore|strain|sprain|broken|torn/i;

interface RecentTemplate {
  id: string;
  title: string;
  created_at: string;
  days: any;
}

const Generator = () => {
  const { user, authUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [editing, setEditing] = useState(false);
  const [level, setLevel] = useState("");
  const [goal, setGoal] = useState("");
  const [equipment, setEquipment] = useState("full_gym");
  const [extraNotes, setExtraNotes] = useState("");
  const [trainingDays, setTrainingDays] = useState(3);

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [result, setResult] = useState<WorkoutPlan | null>(null);
  const [recentPlans, setRecentPlans] = useState<RecentTemplate[]>([]);
  const [showProgramWarning, setShowProgramWarning] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  // Dialog state
  const [pendingDay, setPendingDay] = useState<WorkoutDay | null>(null);

  // Load user profile
  useEffect(() => {
    if (user) {
      setLevel(user.level || "");
      setGoal(user.goal || "");
      if (!user.gymName || user.gymName === "Home Gym") {
        setEquipment("bodyweight_dumbbells");
      } else {
        setEquipment("full_gym");
      }
    }
  }, [user]);

  // Load recent plans
  useEffect(() => {
    if (!authUser) return;
    supabase
      .from("workout_templates")
      .select("id, title, created_at, days")
      .eq("user_id", authUser.id)
      .eq("source", "ai")
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data) {
          setRecentPlans(data as RecentTemplate[]);
        }
      });
  }, [authUser, result]);

  const activeLevel = editing ? level : (user?.level || level);
  const activeGoal = editing ? goal : (user?.goal || goal);
  const hasInjuryNote = INJURY_KEYWORDS.test(extraNotes);
  const hasSavedTemplates = recentPlans.length > 0;

  // ═══════════════════════════════════════════════════════════════════════
  // GENERATE WORKOUT
  // ═══════════════════════════════════════════════════════════════════════
  const handleGenerate = async () => {
    if (!activeLevel || !activeGoal) {
      toast({
        title: "Missing info",
        description: "Please set your level and goal first.",
        variant: "destructive",
      });
      return;
    }

    // Show warning if user has saved templates
    if (hasSavedTemplates && !showProgramWarning) {
      setShowProgramWarning(true);
      return;
    }
    setShowProgramWarning(false);

    setLoading(true);
    setResult(null);
    setLoadingMsg(`Consulting Flex Coach for a personalized ${activeLevel} ${activeGoal} plan...`);

    try {
      const { data, error } = await supabase.functions.invoke("generate-workout-v2", {
        body: {
          level: activeLevel,
          goal: activeGoal,
          equipment,
          extra_notes: extraNotes || null,
          weight: user?.weight || null,
          seed: Date.now(),
          num_days: trainingDays,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data as WorkoutPlan);
    } catch (err: any) {
      console.error("Generate workout error:", err);
      toast({
        title: "Generation failed",
        description: err?.message || "Could not generate your workout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // START WORKOUT
  // ═══════════════════════════════════════════════════════════════════════
  const handleStart = async (day: WorkoutDay) => {
    if (!authUser) return;

    // Check for existing active session
    const { data: existing } = await supabase
      .from("active_sessions")
      .select("id")
      .eq("user_id", authUser.id)
      .limit(1);

    if (existing && existing.length > 0) {
      // Show conflict dialog
      setPendingDay(day);
      setShowConflictDialog(true);
      return;
    }

    // No conflict, proceed to workout
    await proceedToWorkout(day);
  };

  const proceedToWorkout = async (day: WorkoutDay) => {
    if (!authUser || !result) return;

    try {
      // Save first so active session exists before navigation.
      await saveWorkoutTemplate({
        title: result.title,
        days: result.days,
        source: "ai",
      });
      navigate("/workout", { state: { workout: day } });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: "Could not save and start workout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDiscardAndStart = async () => {
    if (authUser && pendingDay) {
      await supabase.from("active_sessions").delete().eq("user_id", authUser.id);
      setShowConflictDialog(false);
      const nextDay = pendingDay;
      setPendingDay(null);
      await proceedToWorkout(nextDay);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto flex items-center justify-between py-4 px-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
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

      <main className="container mx-auto px-6 py-10 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-4 shadow-hero">
              <Zap className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">AI Workout Generator</h1>
            <p className="text-muted-foreground">Your plan, personalized to your profile.</p>
          </div>

          {/* Cross-nav to import */}
          <div className="flex justify-center mb-8">
            <Link
              to="/import-plan"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-all text-sm font-medium border border-border"
            >
              <FileText className="w-4 h-4" />
              Switch to Manual Import
            </Link>
          </div>

          {/* Profile stats */}
          {user && (
            <ProfileStats
              user={user}
              editing={editing}
              onEditToggle={() => setEditing((p) => !p)}
            />
          )}

          {/* Level & Goal Selection */}
          <AnimatePresence>
            {(editing || !user?.level || !user?.goal) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-card rounded-2xl p-8 border border-border shadow-card mb-6">
                  {(!user?.level || editing) && (
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-foreground mb-3">
                        Your Level
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {levels.map((l) => (
                          <button
                            key={l}
                            onClick={() => setLevel(l)}
                            className={`py-3 rounded-xl text-sm font-semibold transition-all border ${
                              level === l
                                ? "gradient-hero text-primary-foreground border-transparent shadow-hero"
                                : "bg-muted text-foreground border-border hover:border-primary"
                            }`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!user?.goal || editing) && (
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-3">
                        Your Goal
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {goals.map((g) => (
                          <button
                            key={g}
                            onClick={() => setGoal(g)}
                            className={`py-3 rounded-xl text-sm font-semibold transition-all border ${
                              goal === g
                                ? "bg-secondary text-secondary-foreground border-transparent"
                                : "bg-muted text-foreground border-border hover:border-secondary"
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Optional Details */}
          <div className="mb-6">
            <OptionalDetails
              equipment={equipment}
              onEquipmentChange={setEquipment}
              extraNotes={extraNotes}
              onExtraNotesChange={setExtraNotes}
              trainingDays={trainingDays}
              onTrainingDaysChange={setTrainingDays}
            />
          </div>

          {/* Injury Warning */}
          <AnimatePresence>
            {hasInjuryNote && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-xl p-4">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Coach's Safety Note</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      We detected an injury-related note. The AI will try to avoid exercises
                      that could aggravate it, but always consult a medical professional before
                      training with an injury.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Program Warning */}
          <AnimatePresence>
            {showProgramWarning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="flex flex-col gap-3 bg-accent/50 border border-border rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        You have an active program saved
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sticking to one program for 8–12 weeks gives the best results. Generate
                        anyway?
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-8">
                    <Link
                      to="/saved-plans"
                      className="px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors border border-border"
                    >
                      View My Plans
                    </Link>
                    <button
                      onClick={() => {
                        setShowProgramWarning(false);
                        handleGenerate();
                      }}
                      className="px-4 py-2 rounded-lg gradient-hero text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
                    >
                      Generate New
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generate Button */}
          <div className="mb-8">
            <button
              onClick={handleGenerate}
              disabled={(!activeLevel || !activeGoal) || loading}
              className="w-full py-4 rounded-xl gradient-hero text-primary-foreground font-display font-bold text-lg shadow-hero hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" /> Generate with AI
                </>
              )}
            </button>
            {loading && loadingMsg && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm text-muted-foreground mt-3"
              >
                {loadingMsg}
              </motion.p>
            )}
          </div>

          {/* Workout Result */}
          <AnimatePresence>
            {result && (
              <WorkoutResult
                result={result}
                level={activeLevel}
                goal={activeGoal}
                onStart={handleStart}
              />
            )}
          </AnimatePresence>

          {/* Recent Plans */}
          {!result && recentPlans.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" /> Recently Generated
              </h3>
              <div className="space-y-2">
                {recentPlans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => navigate("/saved-plans")}
                    className="w-full flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{plan.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(plan.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {Array.isArray(plan.days) ? plan.days.length : 0} days
                    </Badge>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Conflict Dialog: Resume or Discard */}
      <AlertDialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Active Workout in Progress</AlertDialogTitle>
            <AlertDialogDescription>
              You already have a workout in progress. Starting this new plan will discard your
              current progress. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscardAndStart}
              className="gradient-hero text-primary-foreground border-0"
            >
              Discard & Start New
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Generator;