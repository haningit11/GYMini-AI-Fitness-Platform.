import { motion } from "framer-motion";
import { Star, ChevronUp } from "lucide-react";
import { rankTiers, getRankProgress } from "@/lib/xp-logic";

// Re-export for backward compatibility
export { getRankProgress };

const tierStyles: Record<string, { color: string; accent: string; ring: string }> = {
  Rookie: { color: "bg-muted", accent: "text-muted-foreground", ring: "ring-muted" },
  Bronze: { color: "bg-orange-600/15", accent: "text-orange-700", ring: "ring-orange-600" },
  Silver: { color: "bg-slate-400/15", accent: "text-slate-400", ring: "ring-slate-400" },
  Gold: { color: "bg-amber-500/15", accent: "text-amber-500", ring: "ring-amber-400" },
  Platinum: { color: "bg-violet-500/15", accent: "text-violet-400", ring: "ring-violet-400" },
  Diamond: { color: "bg-sky-500/15", accent: "text-sky-400", ring: "ring-sky-400" },
};

function getStyle(name: string) {
  return tierStyles[name] || tierStyles.Rookie;
}

interface RankProgressBadgeProps {
  xp: number;
  rank: string;
  compact?: boolean;
}

export const RankProgressBadge = ({ xp, rank, compact = false }: RankProgressBadgeProps) => {
  const { current, next, progress, currentIdx } = getRankProgress(xp);
  const currentStyle = getStyle(current.name);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold ${currentStyle.accent}`}>{current.name}</span>
        {next && (
          <>
            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{next.name}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            className={`w-12 h-12 rounded-xl ${currentStyle.color} flex items-center justify-center`}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Star className={`w-6 h-6 ${currentStyle.accent}`} />
          </motion.div>
          <div>
            <p className={`font-display font-bold text-lg ${currentStyle.accent}`}>{current.name}</p>
            <p className="text-xs text-muted-foreground">{xp.toLocaleString()} XP</p>
          </div>
        </div>
        {next && (
          <div className="text-right">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ChevronUp className="w-3 h-3" />
              Next: <span className={`font-bold ${getStyle(next.name).accent}`}>{next.name}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {(next.minXP - xp).toLocaleString()} XP to go
            </p>
          </div>
        )}
      </div>

      <div className="relative">
        <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full gradient-hero"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground text-right mt-1">{Math.round(progress)}%</p>
      </div>

      <div className="flex items-center justify-between mt-3">
        {rankTiers.map((tier, i) => {
          const style = getStyle(tier.name);
          return (
            <motion.div
              key={tier.name}
              className="flex flex-col items-center gap-1"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              <div
                className={`w-3 h-3 rounded-full transition-all ${
                  i <= currentIdx ? `${style.color} ring-2 ${style.ring}` : "bg-muted"
                }`}
              />
              <span className={`text-[9px] ${i <= currentIdx ? style.accent : "text-muted-foreground"} font-medium`}>
                {tier.name}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
