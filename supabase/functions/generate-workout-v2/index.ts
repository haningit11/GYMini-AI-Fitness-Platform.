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
    const { level, goal, equipment, extra_notes, weight, seed, num_days } = await req.json();
    const GOOGLE_AI_KEY = Deno.env.get("GOOGLE_AI_KEY");
    
    if (!GOOGLE_AI_KEY) {
      console.error("GOOGLE_AI_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured on server" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const equipmentMap: Record<string, string> = {
      full_gym: "full gym with machines, barbells, dumbbells, cables, and benches",
      bodyweight_dumbbells: "bodyweight exercises and dumbbells only",
      resistance_bands: "resistance bands only",
      minimal: "no equipment (bodyweight only)",
    };

    const equipmentDesc = equipmentMap[equipment] || equipment;

    // Prefer explicit num_days from the client; fall back to regex in notes; default to 3
    const dayMatch = extra_notes?.match(/(\d)\s*(?:day|días|jour|dia)/i);
    const numDays = num_days ?? (dayMatch ? parseInt(dayMatch[1]) : 3);

    const hasInjuryNote = /injur|hurt|pain|sore|strain|sprain|broken|torn/i.test(extra_notes || "");

    const prompt = `Create a personalized ${numDays}-day workout plan with the following parameters:
- Fitness Level: ${level}
- Goal: ${goal}
- Available Equipment: ${equipmentDesc}
- Body Weight: ${weight ? weight + "kg" : "not provided"}
${extra_notes ? `- Special Notes: ${extra_notes}` : ""}
- Variation seed: ${seed}

STRICT RULES:
1. DURATION: You MUST return EXACTLY ${numDays} days. Not more, not less.
2. VARIETY: Use the variation seed to randomize exercise selection. Do NOT always pick the same basic exercises. Mix in variations (e.g., Bulgarian Split Squats instead of Squats, Diamond Push-ups instead of Push-ups, Incline DB Press instead of Bench Press).
3. EQUIPMENT: If equipment is "${equipmentDesc}", ONLY use exercises possible with that equipment. No cable or barbell exercises for bodyweight/dumbbell setups.
4. Include 4-6 exercises per day.
5. Use rep ranges appropriate for the goal (higher reps for cutting, lower for bulking).
6. Reps can be numbers like "12" or time-based like "30s" or "12 each".
7. Make each day target different muscle groups.
8. If there are injury notes, avoid exercises that would aggravate them.
${hasInjuryNote ? `9. IMPORTANT — The user mentioned an injury or pain. You MUST include a "safety_disclaimer" field in the JSON with specific, helpful advice about training around that particular injury. Be specific to the body part mentioned.` : ""}

Return ONLY valid JSON with this exact structure, no markdown or explanation:
{
  "version": 2,
  "title": "A short descriptive title for the plan",
  ${hasInjuryNote ? `"safety_disclaimer": "Specific safety advice about training with the mentioned injury...",` : ""}
  "days": [
    {
      "day": "Day 1 — Theme",
      "exercises": [
        { "name": "Exercise Name", "sets": 3, "reps": "12" }
      ]
    }
  ]
}`;

    console.log("Sending request to Gemini API with key:", GOOGLE_AI_KEY.substring(0, 10) + "...");
    console.log("Prompt:", prompt.substring(0, 200) + "...");

    // CORRECT: Key goes in the URL, not the header
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    console.log("Gemini API Response Status:", response.status);

    if (!response.ok) {
      const t = await response.text();
      console.error("Gemini API error:", response.status, t);
      return new Response(
        JSON.stringify({ error: `AI service error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("Gemini full response:", JSON.stringify(data, null, 2));

    // Gemini returns candidates[].content.parts[].text
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!raw) {
      console.error("No text content in Gemini response");
      return new Response(
        JSON.stringify({ error: "No response from AI service" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Gemini raw response:", raw);

    // If Gemini wraps the JSON in backticks, strip them out
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
    const jsonString = jsonMatch[1]?.trim() || raw.trim();

    console.log("Extracted JSON:", jsonString.substring(0, 200) + "...");

    let plan;
    try {
      plan = JSON.parse(jsonString);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr);
      console.error("Attempted to parse:", jsonString);
      return new Response(
        JSON.stringify({ error: "Invalid response format from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure version tag is always present
    if (!plan.version) plan.version = 2;

    console.log("Final plan:", JSON.stringify(plan, null, 2));

    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-workout-v2 error:", e);
    const errorMsg = e instanceof Error ? e.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});