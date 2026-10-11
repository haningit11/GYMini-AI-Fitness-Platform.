import { useState } from "react";
import { Dumbbell, Mail, Lock, User, Eye, EyeOff, ChevronRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=]).{8,}$/;

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  
  //otp code
  const [otpCode, setOtpCode] = useState(""); // 
  
  const { signUp, verifyEmail, isAuthenticated, loading: authLoading } = useAuth();
  
  const { toast } = useToast();
  const navigate = useNavigate();
  

  if (!authLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const validatePassword = (pw: string) => {
    if (pw.length < 8) return "Must be at least 8 characters";
    if (!/[A-Z]/.test(pw)) return "Must include an uppercase letter";
    if (!/[a-z]/.test(pw)) return "Must include a lowercase letter";
    if (!/\d/.test(pw)) return "Must include a number";
    if (!/[!@#$%^&*()_\-+=]/.test(pw)) return "Must include a special character (!@#$%^&*)";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    const pwErr = validatePassword(password);
    if (pwErr) {
      setPasswordError(pwErr);
      return;
    }
    setLoading(true);
    try {
      const { error, requiresEmailConfirmation } = await signUp(email, password, name);
      if (error) {
        toast({ title: "Sign up failed", description: error, variant: "destructive" });
        return;
      }

      if (requiresEmailConfirmation) {
        setEmailSent(true);
        return;
      }

      toast({ title: "Account created", description: "You are now signed in." });
      navigate("/dashboard", { replace: true });
    } catch {
      toast({
        title: "Sign up failed",
        description: "Unexpected error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 8) return;

    setLoading(true);
    try {
      const { error } = await verifyEmail(email, otpCode);
      if (error) {
        toast({ title: "Verification failed", description: error, variant: "destructive" });
      } else {
        toast({ title: "Verified!", description: "Welcome to GYMini." });
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }; //otp verify

if (emailSent) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Verify Your Account
          </h1>
          <p className="text-muted-foreground mb-6">
            Enter the 8-digit code sent to <strong className="text-foreground">{email}</strong>.
          </p>
          
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="00000000"
                maxLength={8}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))} 
                className="w-full pl-11 pr-4 py-4 rounded-3xl border border-border bg-card text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={otpCode.length !== 8|| loading}
              className="w-full py-4 rounded-3xl gradient-hero text-primary-foreground font-bold text-lg shadow-hero hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Confirm Code"}
            </button>
          </form>

          <button 
            type="button"
            onClick={() => setEmailSent(false)} 
            className="mt-6 text-sm text-muted-foreground hover:text-primary transition-colors underline"
          >
            Back to Sign Up
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative items-center justify-center p-12">
        <div className="relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="w-20 h-20 rounded-3xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-6">
              <Dumbbell className="w-10 h-10 text-primary-foreground" />
            </div>
            <h2 className="text-4xl font-extrabold text-primary-foreground mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Join GYMini
            </h2>
            <p className="text-primary-foreground/80 text-lg max-w-sm mx-auto">
              Your AI Workout Architect. Personalized workouts, community support, and real results.
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

          <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>Create Account</h1>
          <p className="text-muted-foreground mb-8">
            Already have an account?{" "}
            <Link to="/sign-in" className="text-primary font-semibold hover:underline">Sign In</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-3 rounded-3xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
              </div>
            </div>
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
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(validatePassword(e.target.value)); }}
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-12 py-3 rounded-3xl border ${passwordError && password ? 'border-destructive' : 'border-border'} bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordError && password && (
                <p className="text-xs text-destructive mt-1.5 ml-3">{passwordError}</p>
              )}
            </div>
            <button type="submit" disabled={!name || !email || !password || loading}
              className="w-full py-4 rounded-3xl gradient-hero text-primary-foreground font-bold text-lg shadow-hero hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ fontFamily: "'Montserrat', sans-serif" }}>
              {loading ? "Creating account..." : (<>Create Account <ChevronRight className="w-5 h-5" /></>)}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default SignUp;
