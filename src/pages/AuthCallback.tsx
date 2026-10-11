import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase automatically picks up the token from the URL hash/query
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error.message);
          setErrorMsg(error.message);
          setStatus("error");
          return;
        }

        if (!data.session) {
          // Try exchanging the hash — Supabase may need a moment
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            const { error: setError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (setError) {
              setErrorMsg(setError.message);
              setStatus("error");
              return;
            }
          } else {
            // Check for error in hash
            const errorDescription = hashParams.get("error_description");
            if (errorDescription) {
              setErrorMsg(errorDescription);
              setStatus("error");
              return;
            }
            setErrorMsg("No session found. The link may have expired.");
            setStatus("error");
            return;
          }
        }

        // Session is now available — resolve role and redirect
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          setErrorMsg("Could not retrieve user.");
          setStatus("error");
          return;
        }

        setStatus("success");

        // Fetch role
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id);

        const isAdmin = roles?.some((r) => r.role === "admin") ?? false;
        const isGymAdmin = roles?.some((r) => r.role === "gym_admin") ?? false;

        // Brief pause so user sees the success state
        await new Promise((r) => setTimeout(r, 1500));

        if (isAdmin) {
          navigate("/admin", { replace: true });
        } else if (isGymAdmin) {
          navigate("/gym-admin", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } catch (err: any) {
        console.error("Auth callback unexpected error:", err);
        setErrorMsg(err?.message || "An unexpected error occurred.");
        setStatus("error");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-card flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Verifying your email...
            </h1>
            <p className="text-muted-foreground">Please wait while we confirm your account.</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Email Verified!
            </h1>
            <p className="text-muted-foreground">Redirecting you to your dashboard...</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Verification Failed
            </h1>
            <p className="text-muted-foreground">{errorMsg}</p>
            <a
              href="/sign-in"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-hero text-primary-foreground font-semibold shadow-hero hover:opacity-90 transition-all mt-4"
            >
              Go to Sign In
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
