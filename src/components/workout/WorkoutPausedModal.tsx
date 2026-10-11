import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pause, Star, Home, RotateCcw,Flame } from "lucide-react";


interface WorkoutPausedModalProps {
  show: boolean;
  xpEarned: number;
  caloriesBurned?: number;  // 
  onDashboard: () => void;
  onResume: () => void;
}

const WorkoutPausedModal = ({
  show,
  xpEarned,
  caloriesBurned = 0,  // ← ADD THIS LINE
  onDashboard,
  onResume,
}: WorkoutPausedModalProps) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center"
          >
            {/* Icon with pulse animation */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 rounded-full bg-blue-500/15 flex items-center justify-center mx-auto mb-4"
            >
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
              >
                <Pause className="w-8 h-8 text-blue-500" />
              </motion.div>
            </motion.div>

            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              Workout Paused
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Great work! You can come back anytime to finish and earn even more.
            </p>

            {/* XP Earned Badge */}
            {xpEarned > 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-xl"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-primary" />
                  <span className="text-sm font-semibold text-muted-foreground">XP Earned</span>
                </div>
                <p className="text-3xl font-display font-bold text-primary">
                  +{xpEarned}
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-6 p-4 bg-muted rounded-xl"
              >
                <p className="text-sm text-muted-foreground">
                  Complete sets to earn XP
                </p>
              </motion.div>
            )}

            {/* Calories Burned Badge */}
            {caloriesBurned > 0 && (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.4 }}
    className="mb-6 p-4 bg-secondary/10 border border-secondary/30 rounded-xl"
  >
    <div className="flex items-center justify-center gap-2 mb-2">
      <Flame className="w-5 h-5 text-orange-400" />
      <span className="text-sm font-semibold text-muted-foreground">Calories Burned</span>
    </div>
    <p className="text-2xl font-display font-bold text-orange-400">
      {caloriesBurned}
    </p>
  </motion.div>
)}

            {/* Action Buttons */}
            <div className="space-y-2.5">
              {xpEarned > 0 && (
                <Button
                  onClick={onResume}
                  className="w-full gradient-hero text-primary-foreground border-0 shadow-hero justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Resume Workout
                </Button>
              )}
              <Button
                onClick={onDashboard}
                variant="outline"
                className="w-full justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go to Dashboard
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Your progress is saved. Come back to continue!
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WorkoutPausedModal;