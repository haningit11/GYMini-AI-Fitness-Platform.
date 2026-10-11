import { Brain } from "lucide-react";
import { getRankProgress } from "@/lib/xp-logic";

interface AIInsightsCardProps {
  name: string;
  thisWeekVolume: number;
  lastWeekVolume: number;
  xp: number;
  totalWorkouts: number;
}

const AIInsightsCard = ({ name, thisWeekVolume, lastWeekVolume, xp, totalWorkouts }: AIInsightsCardProps) => {
  const pctChange = lastWeekVolume > 0
    ? ((thisWeekVolume - lastWeekVolume) / lastWeekVolume * 100)
    : thisWeekVolume > 0 ? 100 : 0;

  const { current, next } = getRankProgress(xp);
  const xpRemaining = next ? next.minXP - xp : 0;
  const avgXPPerWorkout = totalWorkouts > 0 ? Math.round(xp / totalWorkouts) : 100;
  const workoutsLeft = next && avgXPPerWorkout > 0 ? Math.ceil(xpRemaining / avgXPPerWorkout) : 0;

  const firstName = name?.split(" ")[0] || "Champ";
  const volumeMsg = pctChange > 0
    ? `Your lifting volume is up by ${pctChange.toFixed(0)}% this week.`
    : pctChange < 0
    ? `Your volume dipped ${Math.abs(pctChange).toFixed(0)}% — let's bounce back!`
    : "Steady volume this week — keep the momentum!";

  return (
    <div className="rounded-2xl bg-card border border-border p-6">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-5 h-5 text-sky-400" />
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">AI Trainer Note</h2>
      </div>
      <p className="text-foreground leading-relaxed">
        Great job, <span className="font-bold text-sky-400">{firstName}</span>! {volumeMsg}{" "}
        {next ? (
          <>
            You are only <span className="font-bold text-emerald-400">{workoutsLeft}</span> session{workoutsLeft !== 1 ? "s" : ""} away from reaching{" "}
            <span className="font-bold text-yellow-400">{next.name}</span>!
          </>
        ) : (
          <>
            You've reached <span className="font-bold text-yellow-400">Diamond</span> — the highest rank! You're an absolute legend! 🏆
          </>
        )}
      </p>
    </div>
  );
};

export default AIInsightsCard;