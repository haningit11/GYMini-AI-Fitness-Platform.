import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SkipForward, Plus, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RestTimerProps {
  duration: number;
  onComplete: () => void;
  show: boolean;
}

const BEEP_FREQUENCY = 880;
const BEEP_DURATION = 0.15;

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = BEEP_FREQUENCY;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + BEEP_DURATION);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + BEEP_DURATION);
    setTimeout(() => ctx.close(), 500);
  } catch {
    // silently fail if audio not supported
  }
}

const RestTimer = ({ duration, onComplete, show }: RestTimerProps) => {
  const [remaining, setRemaining] = useState(duration);
  const [totalDuration, setTotalDuration] = useState(duration);
  const [muted, setMuted] = useState(false);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    if (!show) {
      setRemaining(duration);
      setTotalDuration(duration);
      hasPlayedRef.current = false;
      return;
    }
    setRemaining(duration);
    setTotalDuration(duration);
    hasPlayedRef.current = false;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!hasPlayedRef.current && !muted) {
            hasPlayedRef.current = true;
            playBeep();
            setTimeout(playBeep, 200);
            setTimeout(playBeep, 400);
          }
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [show, duration, onComplete, muted]);

  const handleAdd30 = () => {
    setRemaining((r) => r + 30);
    setTotalDuration((t) => t + 30);
  };

  const progressPercent = totalDuration > 0 ? (remaining / totalDuration) * 100 : 0;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="mt-4 rounded-xl border border-primary/30 bg-primary/5 overflow-hidden"
        >
          {/* Animated progress bar at top */}
          <div className="h-1 w-full bg-muted">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: "100%" }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3, ease: "linear" }}
            />
          </div>

          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-display font-bold text-primary tabular-nums">
                {remaining}s
              </span>
              <span className="text-xs text-muted-foreground">rest</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] px-2.5 gap-1 rounded-full"
                onClick={handleAdd30}
              >
                <Plus className="w-3 h-3" /> 30s
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] px-2.5 gap-1 rounded-full"
                onClick={onComplete}
              >
                <SkipForward className="w-3 h-3" /> Skip
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RestTimer;
