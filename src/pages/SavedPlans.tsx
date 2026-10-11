import { useEffect, useState } from "react";
import { Dumbbell, ArrowLeft, Play, Trash2, Calendar, FileText, Image, Zap, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Json } from "@/integrations/supabase/types";
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

interface Exercise {
  name: string;
  sets: number;
  reps: string;
}

interface WorkoutDay {
  day: string;
  exercises: Exercise[];
}

interface SavedTemplate {
  id: string;
  title: string;
  source: string;
  level: string | null;
  goal: string | null;
  days: Json;
  created_at: string;
}

const sourceIcon: Record<string, typeof Zap> = {
  ai: Zap,
  "import-text": FileText,
  "import-image": Image,
};

const sourceLabel: Record<string, string> = {
  ai: "AI Generated",
  "import-text": "Text Import",
  "import-image": "Image Import",
};

const SavedPlans = () => {
  const { authUser } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [conflictDay, setConflictDay] = useState<WorkoutDay | null>(null);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser) return;
    // Load templates and check for active session in parallel
    Promise.all([
      supabase
        .from("workout_templates")
        .select("*")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("active_sessions")
        .select("id")
        .eq("user_id", authUser.id)
        .limit(1),
    ]).then(([templatesRes, sessionRes]) => {
      setTemplates((templatesRes.data as SavedTemplate[]) || []);
      if (sessionRes.data && sessionRes.data.length > 0) {
        setHasActiveSession(true);
        setActiveSessionId(sessionRes.data[0].id);
      }
      setLoading(false);
    });
  }, [authUser]);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("workout_templates").delete().eq("id", deleteId);
    setTemplates((prev) => prev.filter((t) => t.id !== deleteId));
    setDeleteId(null);
  };

  const [pendingTemplate, setPendingTemplate] = useState<{ days: WorkoutDay[]; dayIndex: number; title: string } | null>(null);

  const handleStartDay = async (day: WorkoutDay, allDays: WorkoutDay[], dayIndex: number, title: string) => {
    if (!authUser?.id) return;
    if (hasActiveSession) {
      setPendingTemplate({ days: allDays, dayIndex, title });
      setConflictDay(day);
    } else {
      const workoutPayload = { title, days: allDays };
      const { error } = await supabase
        .from("active_sessions")
        .insert({
          user_id: authUser.id,
          workout_data: workoutPayload as any,
          current_day_index: dayIndex,
          completed_exercises: {},
          started_at: new Date().toISOString(),
        });

      if (error) return;
      navigate("/dashboard");
    }
  };

  const handleResumeExisting = () => {
    setConflictDay(null);
    if (activeSessionId) {
      navigate("/workout", { state: { resumeSessionId: activeSessionId } });
    }
  };

  const handleStartNew = async () => {
    if (authUser && activeSessionId) {
      await supabase.from("active_sessions").delete().eq("id", activeSessionId);
    }
    
    const template = pendingTemplate;
    if (!template || !authUser?.id) return;

    const workoutPayload = { title: template.title, days: template.days };
  
    const { error } = await supabase
      .from("active_sessions")
      .insert({
        user_id: authUser.id,
        workout_data: workoutPayload as any,
        current_day_index: template.dayIndex,
        completed_exercises: {},
        started_at: new Date().toISOString(),
      });
  
    if (error) {
      console.error("Error creating new session:", error.message);
      return;
    }

    setHasActiveSession(false);
    setActiveSessionId(null);
    setConflictDay(null);
    setPendingTemplate(null);
  
    navigate("/dashboard");
  };
  const parseDays = (days: Json): WorkoutDay[] => {
    if (!Array.isArray(days)) return [];
    return days as unknown as WorkoutDay[];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Active session conflict dialog */}
      <AlertDialog open={!!conflictDay} onOpenChange={(open) => !open && setConflictDay(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Active Workout Found
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have an active workout in progress. Would you like to resume it or start a new one? Starting new will discard your current progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConflictDay(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResumeExisting} className="gradient-hero text-primary-foreground border-0">
              Resume Existing
            </AlertDialogAction>
            <AlertDialogAction onClick={handleStartNew} className="bg-muted text-foreground hover:bg-muted/80 border border-border">
              Start New
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <nav className="bg-card border-b border-border">
        <div className="container mx-auto flex items-center justify-between py-4 px-6">
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">GYMini</span>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold text-foreground mb-1">My Saved Plans</h1>
          <p className="text-muted-foreground mb-8">Pick up where you left off or restart any session.</p>
        </motion.div>

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading plans...</p>
        ) : templates.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border p-10 text-center">
            <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-display font-bold text-lg mb-1">No saved plans yet</p>
            <p className="text-muted-foreground text-sm mb-6">Generate a workout or import a coach plan to get started.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/generator")}>AI Generator</Button>
              <Button className="gradient-hero text-primary-foreground border-0" onClick={() => navigate("/import-plan")}>Import Plan</Button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {templates.map((template, i) => {
              const days = parseDays(template.days);
              const Icon = sourceIcon[template.source] || FileText;
              const isExpanded = expandedId === template.id;

              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
                >
                  {/* Header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : template.id)}
                    className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted/40 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-foreground text-sm truncate">{template.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px] px-2 py-0">
                          {sourceLabel[template.source] || template.source}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(template.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs">{days.length} day{days.length !== 1 ? "s" : ""}</Badge>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteId(template.id); }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </button>

                  {/* Expanded Days */}
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="border-t border-border px-5 pb-5"
                    >
                      <div className="space-y-3 pt-4">
                        {days.map((day, di) => (
                          <div key={di} className="flex items-center justify-between bg-muted/50 rounded-xl p-4">
                            <div>
                              <p className="font-display font-bold text-foreground text-sm">{day.day}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {day.exercises.length} exercise{day.exercises.length !== 1 ? "s" : ""} ·{" "}
                                {day.exercises.reduce((s, e) => s + e.sets, 0)} total sets
                              </p>
                            </div>
                            <Button
                              size="sm"
                              className="gradient-hero text-primary-foreground border-0 shadow-hero"
                              onClick={() => handleStartDay(day, days, di, template.title)}
                            >
                              <Play className="w-4 h-4 mr-1" /> Start
                            </Button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this workout plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the workout plan from your saved plans.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SavedPlans;
