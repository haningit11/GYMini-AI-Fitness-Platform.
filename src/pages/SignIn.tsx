import { useState } from "react";
import { Dumbbell, Mail, Lock, Eye, EyeOff, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { logAction } from "@/lib/systemLog";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, userRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!authLoading && isAuthenticated) {
    const redirectPath = userRole === "admin"
      ? "/admin"
      : userRole === "gym_admin"
        ? "/gym-admin"
        : "/dashboard";

    return <Navigate to={redirectPath} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const { error, role } = await login(email, password); //we called the supabase login function from the authcontext
    setLoading(false);
    if (error) {
      logAction("login_failed", { email, reason: error });
      toast({ title: "Sign in failed", description: error, variant: "destructive" });
      return;
    }
    logAction("login", { email, role: role ?? "user" });
    // Role-based redirect
    if (role === "admin") {
      navigate("/admin", { replace: true });
    } else if (role === "gym_admin") {
      navigate("/gym-admin", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-card flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative items-center justify-center p-12">
        <div className="relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="w-20 h-20 rounded-3xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-6">
              <Dumbbell className="w-10 h-10 text-primary-foreground" />
            </div>
            <h2 className="text-4xl font-extrabold text-primary-foreground mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Welcome Back
            </h2>
            <p className="text-primary-foreground/80 text-lg max-w-sm mx-auto">
              Your AI Workout Architect. Let's crush some goals today.
            </p>
          </motion.div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-card">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground" style={{ fontFamily: "'Montserrat', sans-serif" }}>GYMini</span>
          </Link>

          <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>Sign In</h1>
          <p className="text-muted-foreground mb-8">
            Don't have an account?{" "}
            <Link to="/sign-up" className="text-primary font-semibold hover:underline">Sign Up</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-3xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 rounded-3xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={!email || !password || loading}
              className="w-full py-4 rounded-3xl gradient-hero text-primary-foreground font-bold text-lg shadow-hero hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ fontFamily: "'Montserrat', sans-serif" }}>
              {loading ? "Signing in..." : (<>Sign In <ChevronRight className="w-5 h-5" /></>)}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default SignIn;
