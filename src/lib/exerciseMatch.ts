import { supabase } from "@/integrations/supabase/client";

export interface ExerciseVisual {
  name: string;
  gifUrl: string;
  bodyPart: string;
  target: string;
  equipment: string;
  instructions: string[];
  fallback: boolean;
}

const FALLBACK_VISUAL: ExerciseVisual = {
  name: "Exercise",
  gifUrl: "",
  bodyPart: "",
  target: "",
  equipment: "",
  instructions: [],
  fallback: true,
};

// In-memory cache to avoid re-fetching during a session
const cache = new Map<string, ExerciseVisual>();

export async function fetchExerciseVisual(exerciseName: string): Promise<ExerciseVisual> {
  const key = exerciseName.toLowerCase().trim();
  if (cache.has(key)) return cache.get(key)!;

  try {
    const { data, error } = await supabase.functions.invoke("exercise-lookup", {
      body: { name: exerciseName },
    });

    if (error) {
      console.error("Exercise lookup error:", error);
      cache.set(key, { ...FALLBACK_VISUAL, name: exerciseName });
      return cache.get(key)!;
    }

    if (data?.exercises?.length > 0) {
      const ex = data.exercises[0];
      // Build proxy URL for exercise GIF image
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      let gifUrl = "";
      if (ex.gifUrl && ex.gifUrl.startsWith("__PROXY_ID__")) {
        const exerciseId = ex.gifUrl.replace("__PROXY_ID__", "");
        gifUrl = `${supabaseUrl}/functions/v1/exercise-image?id=${exerciseId}`;
      } else if (ex.gifUrl) {
        gifUrl = ex.gifUrl;
      }
      const visual: ExerciseVisual = {
        name: ex.name || exerciseName,
        gifUrl,
        bodyPart: ex.bodyPart || "",
        target: ex.target || "",
        equipment: ex.equipment || "",
        instructions: Array.isArray(ex.instructions) ? ex.instructions : [],
        fallback: !gifUrl,
      };
      cache.set(key, visual);
      return visual;
    }

    cache.set(key, { ...FALLBACK_VISUAL, name: exerciseName });
    return cache.get(key)!;
  } catch {
    cache.set(key, { ...FALLBACK_VISUAL, name: exerciseName });
    return cache.get(key)!;
  }
}
