import { motion } from "framer-motion";
import { Play, Download, Save, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { exportPlanAsPdf } from "@/lib/workoutExport";
import { saveWorkoutTemplate } from "@/lib/saveTemplate";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext"; 

export interface WorkoutDay {
  day: string;
  exercises: { name: string; sets: number; reps: string }[];
}

export interface WorkoutPlan {
  title: string;
  days: WorkoutDay[];
  version?: number;
  safety_disclaimer?: string;
}

interface WorkoutResultProps {
  result: WorkoutPlan;
  level: string;
  goal: string;
  onStart: (day: WorkoutDay) => void;
}

const WorkoutResult = ({ result, level, goal, onStart }: WorkoutResultProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth(); 

  const handleSaveAndNavigate = async () => {
    try {
      await saveWorkoutTemplate({
        title: result.title,
        days: result.days,
        source: "ai",
        level,
        goal,
      });

      toast({
        title: "Saved!",
        description: "Workout saved to My Saved Plans",
      });

      navigate("/saved-plans");
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Save failed",
        description: "Could not save workout. Please try again.",
        variant: "destructive",
      });
    }
  };
  const handleDownloadPdf = async () => {
  
    try {
      await exportPlanAsPdf({
        title: result.title,
        days: result.days,
        level,
        goal,
        userName: user?.name, 
      });
      toast({
        title: "Success!",
        description: "PDF downloaded",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: "Could not download PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="bg-card rounded-2xl p-8 border border-border shadow-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-display font-bold text-foreground">{result.title}</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveAndNavigate}
            className="text-xs"
          >
            <Save className="w-3.5 h-3.5 mr-1" /> Save Plan
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            className="text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Metadata */}
      <p className="text-sm text-muted-foreground mb-4">
        Level: {level} · Goal: {goal}{result.version ? ` · v${result.version}` : ""}
      </p>

      {/* Safety Disclaimer */}
      {result.safety_disclaimer && (
        <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-6">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Safety Note</p>
            <p className="text-xs text-muted-foreground mt-1">{result.safety_disclaimer}</p>
          </div>
        </div>
      )}

      {/* Workout Days */}
      <div className="space-y-5">
        {result.days.map((day) => (
          <div key={day.day} className="bg-muted rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-foreground">{day.day}</h3>
              <Button
                size="sm"
                className="gradient-hero text-primary-foreground border-0 shadow-hero"
                onClick={() => onStart(day)}
              >
                <Play className="w-3 h-3 mr-1" /> Start
              </Button>
            </div>

            {/* Exercises List */}
            <ul className="space-y-2">
              {day.exercises.map((ex) => (
                <li key={ex.name} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="font-medium text-foreground">{ex.name}</span>
                  <span className="text-xs">— {ex.sets}×{ex.reps}</span>
                </li>
              ))}
            </ul>

            {/* Exercise count */}
            <p className="text-xs text-muted-foreground mt-3">
              {day.exercises.length} exercise{day.exercises.length !== 1 ? "s" : ""} ·{" "}
              {day.exercises.reduce((sum, ex) => sum + ex.sets, 0)} total sets
            </p>
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="mt-8 pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          {result.days.length} days · {result.days.reduce((sum, d) => sum + d.exercises.length, 0)} total exercises
        </p>
      </div>
    </motion.div>
  );
};

export default WorkoutResult;