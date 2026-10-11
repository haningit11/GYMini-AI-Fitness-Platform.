import { Trophy, RotateCcw, Sparkles, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface PlanCompletedModalProps {
  show: boolean;
  xpGained: number;
  bonusXP: number;
  templateTitle: string;
  onRestart: () => void;
  onGenerateNew: () => void;
  onDashboard: () => void;
}

const CONFETTI_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(45, 93%, 58%)",
  "hsl(142, 71%, 45%)",
  "hsl(280, 87%, 65%)",
  "hsl(350, 89%, 60%)",
];

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
}

const PlanCompletedModal = ({
  show,
  xpGained,
  bonusXP,
  templateTitle,
  onRestart,
  onGenerateNew,
  onDashboard,
}: PlanCompletedModalProps) => {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  const generateConfetti = useCallback(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1.2 + Math.random() * 1.2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 4 + Math.random() * 6,
      rotation: Math.random() * 360,
    }));
  }, []);

  useEffect(() => {
    if (show) setConfetti(generateConfetti());
  }, [show, generateConfetti]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        >
          {/* Confetti layer */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
            {confetti.map((piece) => (
              <motion.div
                key={piece.id}
                initial={{
                  opacity: 1,
                  y: -20,
                  x: `${piece.x}vw`,
                  rotate: 0,
                  scale: 1,
                }}
                animate={{
                  opacity: [1, 1, 0],
                  y: "100vh",
                  rotate: piece.rotation + 720,
                  scale: [1, 1, 0.5],
                }}
                transition={{
                  duration: piece.duration,
                  delay: piece.delay,
                  ease: "easeIn",
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  width: piece.size,
                  height: piece.size * 1.4,
                  backgroundColor: piece.color,
                  borderRadius: piece.size > 7 ? "50%" : "1px",
                }}
              />
            ))}
          </div>

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center relative z-[51]"
          >
            {/* Trophy with pulsing gold border */}
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                boxShadow: [
                  "0 0 0px hsl(45, 93%, 58%)",
                  "0 0 25px hsl(45, 93%, 58%)",
                  "0 0 0px hsl(45, 93%, 58%)",
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 rounded-full gradient-hero flex items-center justify-center mx-auto mb-4"
            >
              <Trophy className="w-8 h-8 text-primary-foreground" />
            </motion.div>

            <h2 className="text-2xl font-display font-bold text-foreground mb-1">
              Plan Mastered! 🔥🏆
            </h2>
            <p className="text-muted-foreground text-sm mb-1">
              Incredible! You've finished every day of{" "}
              <span className="font-semibold text-foreground">{templateTitle}</span>.
            </p>
            <p className="text-muted-foreground text-sm mb-2">
              You are officially stronger than when you started.
            </p>

            <div className="mb-6">
              <p className="text-primary font-bold text-lg">+{xpGained} XP Earned</p>
              {bonusXP > 0 && (
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xs font-semibold text-accent-foreground"
                >
                  🎁 Includes +{bonusXP} Plan Completion Bonus!
                </motion.p>
              )}
            </div>

            <div className="space-y-2.5">
              <Button
                onClick={onRestart}
                variant="outline"
                className="w-full justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Restart This Plan
              </Button>
              <Button
                onClick={onGenerateNew}
                className="w-full gradient-hero text-primary-foreground border-0 shadow-hero justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate New AI Plan
              </Button>
              <Button
                onClick={onDashboard}
                variant="ghost"
                className="w-full justify-center gap-2 text-muted-foreground"
              >
                <Home className="w-4 h-4" />
                Finish & Exit
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PlanCompletedModal;
