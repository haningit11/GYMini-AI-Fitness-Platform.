import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";

interface WellDoneOverlayProps {
  show: boolean;
}

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
}

const CONFETTI_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(45, 93%, 58%)",
  "hsl(142, 71%, 45%)",
  "hsl(280, 87%, 65%)",
  "hsl(350, 89%, 60%)",
];

const WellDoneOverlay = ({ show }: WellDoneOverlayProps) => {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  const generateConfetti = useCallback(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.2 + Math.random() * 1,
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
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
        >
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
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WellDoneOverlay;
