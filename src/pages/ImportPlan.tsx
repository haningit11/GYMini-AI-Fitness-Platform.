import { useState, useRef } from "react";
import { Dumbbell, ArrowLeft, FileText, Play, Sparkles, ClipboardPaste, Upload, Download, Zap, Image as ImageIcon, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { exportPlanAsPdf} from "@/lib/workoutExport";
import { saveWorkoutTemplate } from "@/lib/saveTemplate";
import AIThinkingAnimation from "@/components/import/AIThinkingAnimation";
import EditableExerciseList from "@/components/import/EditableExerciseList";
import { useAuth } from "@/contexts/AuthContext"; 
interface Exercise {
  name: string;
  sets: number;
  reps: string;
}

interface WorkoutDay {
  day: string;
  exercises: Exercise[];
}

interface ParsedPlan {
  title: string;
  days: WorkoutDay[];
}

const SAMPLE_PLAN = `Monday - Chest & Triceps
Bench Press 4x10
Incline Dumbbell Press 3x12
Cable Flyes 3x15
Tricep Dips 3x12
Rope Pushdowns 3x15

Wednesday - Back & Biceps
Deadlifts 4x8
Lat Pulldown 3x12
Seated Cable Row 3x12
Barbell Curls 3x10
Hammer Curls 3x12

Friday - Legs & Shoulders
Squats 4x10
Romanian Deadlift 3x12
Leg Press 3x15
Overhead Press 4x10
Lateral Raises 3x15`;

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Sparkle particles for success
const SparkleEffect = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
    {Array.from({ length: 12 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0, x: `${Math.random() * 100}%`, y: `${Math.random() * 100}%` }}
        animate={{
          opacity: [0, 1, 0],
          scale: [0, 1.2, 0],
          y: [`${Math.random() * 100}%`, `${Math.random() * 60}%`],
        }}
        transition={{ duration: 1.2 + Math.random() * 0.8, delay: Math.random() * 0.5, ease: "easeOut" }}
        className="absolute w-2 h-2 rounded-full bg-primary"
        style={{ filter: "blur(0.5px)" }}
      />
    ))}
  </div>
);

const ImportPlan = () => {
  const [planText, setPlanText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParsedPlan | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [importSource, setImportSource] = useState<"text" | "image">("text");
  const [showSparkle, setShowSparkle] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth(); 

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleParse = async () => {
    if (importSource === "text" && planText.trim().length < 10) {
      toast({
        title: "Too short",
        description: "Paste a workout plan with at least a few exercises.",
        variant: "destructive",
      });
      return;
    }
    if (importSource === "image" && !uploadedFile) {
      toast({
        title: "No file",
        description: "Upload an image or PDF of your workout plan.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);
    setShowSparkle(false);

    try {
      const body: any = {};
      if (importSource === "text") {
        body.planText = planText.trim();
      } else if (uploadedFile) {
        body.imageBase64 = await fileToBase64(uploadedFile);
        body.mimeType = uploadedFile.type;
        if (planText.trim().length > 0) body.planText = planText.trim();
      }

      const { data, error } = await supabase.functions.invoke("parse-plan", { body });
      if (error) throw error;
      if (data?.error) {
        toast({
          title: "Parsing failed",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setResult(data as ParsedPlan);
      setShowSparkle(true);
      setTimeout(() => setShowSparkle(false), 2000);
    } catch (err: any) {
      console.error("Parse error:", err);
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file",
        description: "Please upload a PNG, JPEG, WebP, or PDF.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Max 10MB allowed.",
        variant: "destructive",
      });
      return;
    }
    setUploadedFile(file);
    setResult(null);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPlanText(text);
    } catch {
      toast({
        title: "Paste failed",
        description: "Please paste manually.",
        variant: "destructive",
      });
    }
  };

  const handleUseSample = () => {
    setPlanText(SAMPLE_PLAN);
    setResult(null);
  };

  const updateExercises = (dayIdx: number, exercises: Exercise[]) => {
    if (!result) return;
    const newDays = result.days.map((d, i) => (i === dayIdx ? { ...d, exercises } : d));
    setResult({ ...result, days: newDays });
  };

  const dayHasExercises = (day: WorkoutDay) =>
    day.exercises.length > 0 && day.exercises.some((e) => e.name.trim() !== "");

  const handleStart = async (day: WorkoutDay) => {
    if (!result) return;

    try {
      // Save the workout template
      await saveWorkoutTemplate({
        title: result.title,
        days: result.days,
        source: importSource === "text" ? "import-text" : "import-image",
      });

      // Navigate to workout
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

  const handleSaveAndNavigate = async () => {
    if (!result) return;

    try {
      // Save the workout template
      await saveWorkoutTemplate({
        title: result.title,
        days: result.days,
        source: importSource === "text" ? "import-text" : "import-image",
      });

      // Show success
      toast({
        title: "Saved!",
        description: "Workout saved to My Saved Plans",
      });

      // Navigate to saved plans
      navigate("/saved-plans");
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: "Could not save workout. Please try again.",
        variant: "destructive",
      });
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
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl gradient-warm flex items-center justify-center mx-auto mb-4 shadow-hero">
              <FileText className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">Import Coach Plan</h1>
            <p className="text-muted-foreground">Paste text or upload an image/PDF — AI will structure it for you.</p>
          </div>

          {/* Cross-nav */}
          <div className="flex justify-center mb-8">
            <Link
              to="/generator"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-all text-sm font-medium border border-border"
            >
              <Zap className="w-4 h-4" />
              Back to AI Architect
            </Link>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={importSource === "text" ? "default" : "outline"}
              onClick={() => {
                setImportSource("text");
                setResult(null);
              }}
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-2" /> Paste Text
            </Button>
            <Button
              variant={importSource === "image" ? "default" : "outline"}
              onClick={() => {
                setImportSource("image");
                setResult(null);
              }}
              className="flex-1"
            >
              <ImageIcon className="w-4 h-4 mr-2" /> Upload Image/PDF
            </Button>
          </div>

          {/* Input area */}
          <div className="bg-card rounded-2xl p-6 border border-border shadow-card mb-6">
            {importSource === "text" ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-foreground">Paste your plan</label>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handlePaste} className="text-xs">
                      <ClipboardPaste className="w-3.5 h-3.5 mr-1" /> Paste
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleUseSample} className="text-xs">
                      Try Sample
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={planText}
                  onChange={(e) => {
                    setPlanText(e.target.value);
                    setResult(null);
                  }}
                  placeholder={`e.g.\nMonday - Chest\nBench Press 4x10\nIncline DB Press 3x12\n...`}
                  className="min-h-[200px] font-mono text-sm bg-muted border-border resize-y"
                  maxLength={4000}
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">{planText.length}/4000</span>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <label className="text-sm font-semibold text-foreground block">Upload image or PDF</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 hover:border-primary transition-colors bg-muted/50"
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {uploadedFile ? uploadedFile.name : "Click to upload PNG, JPEG, WebP, or PDF (max 10MB)"}
                  </span>
                </button>
                {uploadedFile && (
                  <div className="flex items-center gap-2 text-sm text-foreground bg-muted rounded-lg px-3 py-2">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <span className="truncate">{uploadedFile.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{(uploadedFile.size / 1024).toFixed(0)}KB</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadedFile(null)}
                      className="text-xs h-6 px-2"
                    >
                      Remove
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground italic text-center">
                  Works best with plans from Lebanese coaches like Coach Ali or GoldFit Beirut.
                </p>
              </div>
            )}

            {/* Loading animation */}
            {loading && <AIThinkingAnimation />}

            {!loading && (
              <div className="flex justify-end mt-4">
                <Button
                  onClick={handleParse}
                  disabled={importSource === "text" ? planText.trim().length < 10 : !uploadedFile}
                  className="gradient-hero text-primary-foreground border-0 shadow-hero"
                >
                  <Sparkles className="w-4 h-4 mr-1" /> Parse with AI
                </Button>
              </div>
            )}
          </div>

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-card rounded-2xl p-8 border border-border shadow-card relative"
              >
                {showSparkle && <SparkleEffect />}

                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-display font-bold text-foreground">{result.title}</h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveAndNavigate}
                      className="text-xs"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1" /> Save Plan
                    </Button>
                    
<Button
  variant="outline"
  size="sm"
  onClick={async () => {
    try {
      await exportPlanAsPdf({
        title: result.title,
        days: result.days,
        userName: user?.name, // ← ADD THIS
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download PDF. Please try again.",
        variant: "destructive",
      });
    }
  }}
  className="text-xs"
>
  <Download className="w-3.5 h-3.5 mr-1" /> Download PDF
</Button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {result.days.length} day{result.days.length !== 1 ? "s" : ""} · {result.days.reduce((s, d) => s + d.exercises.length, 0)} exercises
                </p>
                <p className="text-xs text-muted-foreground mb-6 italic">
                  ✏️ Click any exercise name, sets, or reps to edit before starting.
                </p>

                <div className="space-y-5">
                  {result.days.map((day, dayIdx) => {
                    const valid = dayHasExercises(day);
                    return (
                      <div key={day.day} className="bg-muted rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-display font-bold text-foreground">{day.day}</h3>
                          {valid ? (
                            <Button
                              size="sm"
                              className="gradient-hero text-primary-foreground border-0 shadow-hero"
                              onClick={() => handleStart(day)}
                            >
                              <Play className="w-3 h-3 mr-1" /> Start
                            </Button>
                          ) : (
                            <div className="flex items-center gap-1.5 text-destructive text-xs font-medium">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Try a clearer photo
                            </div>
                          )}
                        </div>
                        <EditableExerciseList
                          exercises={day.exercises}
                          onChange={(exs) => updateExercises(dayIdx, exs)}
                        />
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
};

export default ImportPlan;