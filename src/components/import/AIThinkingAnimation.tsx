import { useState, useEffect } from "react";
import { Brain } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

const STEPS = [
  "Analyzing Image Text…",
  "Detecting Exercises…",
  "Structuring Sets & Reps…",
  "Building Your Plan…",
];

const AIThinkingAnimation = () => {
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIdx((prev) => (prev + 1) % STEPS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + Math.random() * 6, 92));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-4 py-10"
    >
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
        className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center shadow-hero"
      >
        <Brain className="w-8 h-8 text-primary-foreground" />
      </motion.div>

      <div className="w-56">
        <Progress value={progress} className="h-2" />
      </div>

      <motion.p
        key={stepIdx}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        className="text-sm font-medium text-muted-foreground"
      >
        {STEPS[stepIdx]}
      </motion.p>
    </motion.div>
  );
};

export default AIThinkingAnimation;
