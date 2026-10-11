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
    const url = new URL(req.url);
    const exerciseId = url.searchParams.get("id");
    
    if (!exerciseId) {
      return new Response("Missing exercise id", { status: 400, headers: corsHeaders });
    }

    const apiKey = Deno.env.get("EXERCISEDB_API_KEY");
    if (!apiKey) {
      return new Response("API key not configured", { status: 500, headers: corsHeaders });
    }

    const imageUrl = `https://exercisedb.p.rapidapi.com/image?exerciseId=${exerciseId}&resolution=360&rapidapi-key=${apiKey}`;
    
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      await response.text();
      return new Response("Image not found", { status: 404, headers: corsHeaders });
    }

    const imageData = await response.arrayBuffer();
    
    return new Response(imageData, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/gif",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("Image proxy error:", err);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
