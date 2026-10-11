import { CheckCircle, Home, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

// ===== FIXED: Add bonusXP to the interface =====
interface DayCompletedModalProps {
  show: boolean;
  xpGained: number;
  bonusXP: number; // ← THIS 
  currentDay: number;
  totalDays: number;
  caloriesBurned: number;  // ← ADD THIS LINE to show calories burned
  onDashboard: () => void;
}

const DayCompletedModal = ({
  show,
  xpGained,
  bonusXP,
  currentDay,
  totalDays,
  caloriesBurned,  // ← ADD THIS LINE
  onDashboard,
}: DayCompletedModalProps) => {
  // Calculate set XP (total earned - bonuses)
  const setXP = xpGained - bonusXP;

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
            {/* Green checkmark with calm pulse */}
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4"
            >
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
              >
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </motion.div>
            </motion.div>

            <h2 className="text-2xl font-display font-bold text-foreground mb-1">
              Great Job! 💪
            </h2>
            <p className="text-muted-foreground text-sm mb-1">
              You've done enough for today! Rest up and fuel your body.
            </p>
            <p className="text-muted-foreground text-sm mb-4">
              You can continue with{" "}
              <span className="font-semibold text-foreground">Day {currentDay + 1}</span> tomorrow.
            </p>

          {/* ===== REWARDS BREAKDOWN ===== */}
<div className="text-left bg-muted rounded-xl p-4 mb-6 space-y-2">
  {/* XP Section */}
  <div>
    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">XP Earned</p>
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm text-muted-foreground">Set XP (5 per set):</span>
      <span className="text-sm font-semibold text-foreground">{setXP} XP</span>
    </div>
    {bonusXP > 0 && (
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-muted-foreground">Day Completion Bonus:</span>
        <span className="text-sm font-semibold text-primary">+{bonusXP} XP</span>
      </div>
    )}
    <div className="border-t border-border pt-2 flex justify-between items-center">
      <span className="text-sm font-bold text-foreground">Total XP:</span>
      <span className="text-lg font-bold text-primary">+{xpGained} XP</span>
    </div>
  </div>

  {/* Calories Section */}
  {caloriesBurned > 0 && (
    <div className="pt-3 border-t border-border/50">
      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Calories Burned</p>
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Workout energy:</span>
        <span className="text-lg font-bold text-orange-400">{caloriesBurned} cal</span>
      </div>
    </div>
  )}
</div>

            <Button
              onClick={onDashboard}
              className="w-full gradient-hero text-primary-foreground border-0 shadow-hero justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DayCompletedModal;