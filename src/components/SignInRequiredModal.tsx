import { Shield, Sparkles, Clock, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface SignInRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

const SignInRequiredModal = ({ open, onOpenChange, feature }: SignInRequiredModalProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl border-border bg-card p-0 overflow-hidden">
        {/* Top gradient banner */}
        <div className="gradient-hero px-6 pt-8 pb-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary-foreground" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold text-primary-foreground">
              Sign In Required
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 mt-1">
              {feature
                ? `You need an account to ${feature}.`
                : "You need an account to access this feature."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Create a free account to verify your gym membership and save AI workouts.
          </p>

          <div className="space-y-3">
            {[
              { icon: Sparkles, text: "AI-powered personalized workouts" },
              { icon: Shield, text: "Secure 6-digit OTP email verification" },
              { icon: Clock, text: "15-minute verification for your safety" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-foreground">
                <div className="w-8 h-8 rounded-xl bg-[hsl(var(--sky-light))] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                {text}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => { onOpenChange(false); navigate("/sign-up"); }}
              className="w-full py-3 rounded-2xl gradient-hero text-primary-foreground font-bold text-sm shadow-hero hover:opacity-90 transition-opacity"
            >
              Get Started — It's Free
            </button>
            <button
              onClick={() => { onOpenChange(false); navigate("/sign-in"); }}
              className="w-full py-3 rounded-2xl border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors"
            >
              I Already Have an Account
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignInRequiredModal;
