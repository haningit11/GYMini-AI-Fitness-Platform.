import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { Star, Crown } from "lucide-react";

interface RankUpCelebrationProps {
  show: boolean;
  newRank: string;
  onComplete?: () => void;
}

const CONFETTI_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(45, 93%, 58%)",
  "hsl(280, 87%, 65%)",
  "hsl(350, 89%, 60%)",
  "hsl(160, 55%, 48%)",
];

const rankIcons: Record<string, typeof Star> = {
  Bronze: Star,
  Silver: Star,
  Gold: Crown,
  Platinum: Crown,
  Diamond: Crown,
};

const rankGlow: Record<string, string> = {
  Bronze: "shadow-[0_0_60px_hsl(25,80%,50%/0.4)]",
  Silver: "shadow-[0_0_60px_hsl(210,10%,70%/0.4)]",
  Gold: "shadow-[0_0_60px_hsl(45,93%,55%/0.5)]",
  Platinum: "shadow-[0_0_60px_hsl(270,70%,60%/0.4)]",
  Diamond: "shadow-[0_0_80px_hsl(199,80%,55%/0.5)]",
};

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
}

export const RankUpCelebration = ({ show, newRank, onComplete }: RankUpCelebrationProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  const generate = useCallback(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.5 + Math.random() * 1.5,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 4 + Math.random() * 8,
      rotation: Math.random() * 360,
    }));
  }, []);

  useEffect(() => {
    if (show) {
      setParticles(generate());
      const timer = setTimeout(() => onComplete?.(), 3500);
      return () => clearTimeout(timer);
    }
  }, [show, generate, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Confetti */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, y: -20, x: `${p.x}vw`, rotate: 0, scale: 1 }}
              animate={{
                opacity: [1, 1, 0],
                y: "110vh",
                rotate: p.rotation + 720,
                scale: [1, 1.2, 0.5],
              }}
              transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
              style={{
                position: "absolute",
                top: 0,
                width: p.size,
                height: p.size * 1.4,
                backgroundColor: p.color,
                borderRadius: p.size > 7 ? "50%" : "2px",
              }}
            />
          ))}

          {/* Burst rings */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={`ring-${i}`}
              className="absolute w-32 h-32 rounded-full border-2 border-primary/30"
              initial={{ scale: 0.5, opacity: 0.8 }}
              animate={{ scale: 3 + i, opacity: 0 }}
              transition={{ duration: 1.5, delay: 0.2 * i, ease: "easeOut" }}
            />
          ))}

          {/* Center card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className={`relative bg-card/95 backdrop-blur-md rounded-3xl px-12 py-10 border border-primary/30 text-center z-10 ${rankGlow[newRank] || ""}`}
          >
            {/* Floating icon */}
            <motion.div
              animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="mx-auto mb-4"
            >
              <div className="w-20 h-20 rounded-2xl gradient-hero flex items-center justify-center mx-auto">
                {newRank === "Diamond" ? (
                  <Crown className="w-10 h-10 text-primary-foreground" />
                ) : (
                  <Star className="w-10 h-10 text-primary-foreground" />
                )}
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-2"
            >
              Rank Up!
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
              className="text-4xl font-display font-bold text-foreground"
            >
              {(() => { const Icon = rankIcons[newRank] || Star; return <Icon className="w-8 h-8 inline-block mr-2 text-primary" />; })()} {newRank}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-sm text-muted-foreground mt-3"
            >
              You've reached a new tier. Keep crushing it!
            </motion.p>

            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "60%" }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="h-0.5 gradient-hero rounded-full mx-auto mt-4"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
