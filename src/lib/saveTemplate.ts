import { supabase } from "@/integrations/supabase/client";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
}

interface WorkoutDay {
  day: string;
  exercises: Exercise[];
}

export async function saveWorkoutTemplate({
  title,
  days,
  source,
  level,
  goal,
}: {
  title: string;
  days: WorkoutDay[];
  source: "ai" | "import-text" | "import-image";
  level?: string;
  goal?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("workout_templates" as any).insert({
    user_id: user.id,
    title,
    source,
    days,
    level: level || null,
    goal: goal || null,
  } as any);

  if (error) {
    console.error("Failed to save template:", error);
    throw error;
  }
}
