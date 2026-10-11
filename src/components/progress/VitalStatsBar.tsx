import { Flame, TrendingUp, TrendingDown, Dumbbell, Trophy, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { getRankName, getProgressToNextLevel, calculateLevel } from "@/lib/xp-logic";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VitalStatsBarProps {
  currentWeight: number | null;
  startWeight: number | null;
  totalWorkouts: number;
  totalVolume: number;
  xp: number;
}

const VitalStatsBar = ({ currentWeight, startWeight, totalWorkouts, totalVolume, xp }: VitalStatsBarProps) => {
  const rank = getRankName(xp);
  const level = calculateLevel(xp);
  const progressToNext = getProgressToNextLevel(xp);
  const weightTrend = currentWeight && startWeight ? currentWeight - startWeight : 0;

  const stats = [
    {
      label: "Weight",
      value: currentWeight ? `${currentWeight} kg` : "—",
      icon: weightTrend >= 0 ? TrendingUp : TrendingDown,
      iconColor: weightTrend >= 0 ? "text-emerald-400" : "text-red-400",
      sub: weightTrend !== 0 ? `${weightTrend > 0 ? "+" : ""}${weightTrend.toFixed(1)} kg` : null,
    },
    {
      label: "Consistency",
      value: totalWorkouts.toString(),
      icon: Flame,
      iconColor: "text-orange-400",
      sub: "Total Workouts",
    },
    {
      label: "Total Volume",
      value: totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume.toString(),
      icon: Dumbbell,
      iconColor: "text-sky-400",
      sub: "kg lifted",
      hasTooltip: true,
    },
    {
      label: `${rank} · Lv ${level}`,
      value: null,
      icon: Trophy,
      iconColor: "text-yellow-400",
      sub: null,
      isRank: true,
    },
  ];

  return (
    <TooltipProvider>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl bg-card border border-border p-5 flex flex-col gap-2"
        >
          <div className="flex items-center gap-2">
            <s.icon className={`w-5 h-5 ${s.iconColor}`} />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</span>
            {(s as any).hasTooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[220px] text-xs">
                  Total Volume = Weight × Reps. This tracks the total energy exerted across all your recorded exercises.
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {s.isRank ? (
            <div className="mt-1">
              <Progress value={progressToNext} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1.5">{progressToNext.toFixed(0)}% towards next level</p>
            </div>
          ) : (
            <>
              <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
              {s.sub && <p className="text-xs text-muted-foreground">{s.sub}</p>}
            </>
          )}
        </div>
      ))}
    </div>
    </TooltipProvider>
  );
};

export default VitalStatsBar;
