import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name } = await req.json();
    if (!name || typeof name !== "string") {
      return new Response(JSON.stringify({ error: "Missing exercise name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("EXERCISEDB_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize: lowercase, remove special chars, trim
    const sanitized = name
      .toLowerCase()
      .replace(/[-_]/g, " ")
      .replace(/[^a-z0-9 ]/g, "")
      .trim();

    const url = `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(sanitized)}?limit=5&offset=0`;

    const response = await fetch(url, {
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "exercisedb.p.rapidapi.com",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("ExerciseDB error:", response.status, text);
      return new Response(JSON.stringify({ exercises: [], fallback: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    // Map exercise to include proxy gifUrl (no API key exposed)
    const mapExercise = (ex: Record<string, unknown>) => ({
      ...ex,
      gifUrl: ex.id ? `__PROXY_ID__${ex.id}` : "",
    });

    // If no results, try partial match with first word
    if (Array.isArray(data) && data.length === 0) {
      const firstWord = sanitized.split(" ")[0];
      if (firstWord.length >= 3) {
        const fallbackUrl = `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(firstWord)}?limit=3&offset=0`;
        const fallbackRes = await fetch(fallbackUrl, {
          headers: {
            "x-rapidapi-key": apiKey,
            "x-rapidapi-host": "exercisedb.p.rapidapi.com",
          },
        });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          return new Response(
            JSON.stringify({
              exercises: Array.isArray(fallbackData) ? fallbackData.slice(0, 1).map(mapExercise) : [],
              fallback: !fallbackData?.length,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        await fallbackRes.text();
      }
      return new Response(JSON.stringify({ exercises: [], fallback: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        exercises: Array.isArray(data) ? data.slice(0, 1).map(mapExercise) : [],
        fallback: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal error", exercises: [], fallback: true }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
