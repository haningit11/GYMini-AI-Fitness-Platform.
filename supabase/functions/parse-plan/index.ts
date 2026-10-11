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
    const body = await req.json();
    const { planText, imageBase64, mimeType } = body;

    console.log("📥 Received parse-plan request");
    console.log("Has text:", !!planText, "Has image:", !!imageBase64);

    // Validate: must have either planText or imageBase64
    const hasText = planText && typeof planText === "string" && planText.trim().length >= 10;
    const hasImage = imageBase64 && typeof imageBase64 === "string" && mimeType;

    if (!hasText && !hasImage) {
      console.error("❌ No valid input provided");
      return new Response(
        JSON.stringify({ error: "Please provide a valid workout plan text or image." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GOOGLE_AI_KEY = Deno.env.get("GOOGLE_AI_KEY");
    if (!GOOGLE_AI_KEY) {
      console.error("❌ GOOGLE_AI_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured on server" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the prompt based on input type
    let systemPrompt = `You are a fitness plan parser. Given raw text or an image of a workout plan from a coach or program, extract the structured data and return it as valid JSON.

Rules:
- Extract all exercises with their sets and reps
- If sets/reps are not explicit, infer reasonable defaults (e.g., 3x10 for most exercises)
- Group exercises by day or session
- If no clear day structure exists, create logical groupings (e.g., Upper/Lower, Push/Pull/Legs)
- Always include at least 1 day with at least 1 valid exercise
- Infer a descriptive title from the plan

Return ONLY a valid JSON object with NO markdown backticks, NO explanation, NO preamble:
{
  "title": "A short descriptive title (e.g., 'Upper/Lower Split' or 'Coach Ali 6-Week Plan')",
  "days": [
    {
      "day": "Day 1 - Upper Body",
      "exercises": [
        { "name": "Bench Press", "sets": 4, "reps": "8-10" },
        { "name": "Barbell Rows", "sets": 4, "reps": "8-10" }
      ]
    }
  ]
}`;

    let userMessage = "";

    if (hasImage) {
      console.log("🖼️  Processing image...");
      // For image input, we'll use the vision capability
      userMessage = `Parse this workout plan image. Extract all exercises, sets, and reps you can see. Be thorough and extract everything visible.${
        hasText ? `\n\nAdditional text context:\n${planText.slice(0, 2000)}` : ""
      }`;
    } else {
      console.log("📝 Processing text...");
      userMessage = `Parse this workout plan and extract all exercises with their sets and reps:\n\n${planText.slice(0, 4000)}`;
    }

    // Build the request for Google Gemini API
    let requestBody: any = {
      contents: [
        {
          role: "user",
          parts: [],
        },
      ],
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
    };

    // Add text part
    requestBody.contents[0].parts.push({
      text: userMessage,
    });

    // Add image if provided
    if (hasImage && imageBase64) {
      console.log("📸 Adding image to request...");
      requestBody.contents[0].parts.push({
        inlineData: {
          mimeType: mimeType,
          data: imageBase64,
        },
      });
    }

    console.log("🚀 Calling Gemini API...");

    // ✅ CORRECT: Use the proper Gemini API endpoint with key in URL
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("📊 Gemini Response Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Gemini API Error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please check your Google AI credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `AI service error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("🔍 Gemini response structure:", JSON.stringify(data, null, 2).substring(0, 500));

    // Extract text from Gemini response
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) {
      console.error("❌ No text content in Gemini response");
      return new Response(
        JSON.stringify({ error: "AI returned no response. Please try a clearer image or plan." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("📝 Raw Gemini response:", rawText.substring(0, 300) + "...");

    // Parse the JSON from the response
    let parsed;
    try {
      // Try to extract JSON if wrapped in markdown backticks
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawText];
      const jsonString = jsonMatch[1]?.trim() || rawText.trim();

      console.log("🔎 Attempting to parse JSON...");
      parsed = JSON.parse(jsonString);
    } catch (parseErr) {
      console.error("❌ JSON parse error:", parseErr);
      console.error("Attempted to parse:", rawText.substring(0, 500));
      return new Response(
        JSON.stringify({ error: "Could not parse the plan. Please try a clearer image or rephrasing." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate the structure
    if (!parsed.title || !Array.isArray(parsed.days) || parsed.days.length === 0) {
      console.error("❌ Invalid structure from Gemini:", parsed);
      return new Response(
        JSON.stringify({ error: "Could not extract a valid workout plan. Please try a clearer image." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure all exercises have the required fields
    parsed.days = parsed.days.map((day: any) => ({
      day: day.day || "Untitled Day",
      exercises: (day.exercises || [])
        .filter((ex: any) => ex.name && ex.name.trim())
        .map((ex: any) => ({
          name: ex.name.trim(),
          sets: ex.sets || 3,
          reps: (ex.reps || "10").toString(),
        })),
    }));

    // Remove days with no exercises
    parsed.days = parsed.days.filter((day: any) => day.exercises.length > 0);

    if (parsed.days.length === 0) {
      console.error("❌ No valid days with exercises after filtering");
      return new Response(
        JSON.stringify({ error: "No exercises found. Please try a clearer image or plan." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Plan parsed successfully:", JSON.stringify(parsed, null, 2).substring(0, 300));

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("❌ parse-plan error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});