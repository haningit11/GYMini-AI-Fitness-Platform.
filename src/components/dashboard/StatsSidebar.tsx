import { Dumbbell, Flame, Star } from "lucide-react";
import { motion } from "framer-motion";
import { getRankProgress } from "@/lib/xp-logic";
import { RateUsBadge } from "@/components/dashboard/RateUsCard";

interface WorkoutRow {
  id: string;
  workout_date: string;
}

interface StatsSidebarProps {
  totalWorkouts: number;
  totalCalories: number;
  xp: number;
  rank: string;
  workouts?: WorkoutRow[];
}

function getWeekHeatmap(workouts: WorkoutRow[]): boolean[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const days = Array(7).fill(false);
  workouts.forEach((w) => {
    const d = new Date(w.workout_date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.floor((d.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff < 7) days[diff] = true;
  });
  return days;
}

const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

export const StatsSidebar = ({ totalWorkouts, totalCalories, xp, rank, workouts = [] }: StatsSidebarProps) => {
  const { current } = getRankProgress(xp);

  const stats = [
    { label: "Workouts", icon: Dumbbell, color: "text-primary", value: totalWorkouts, unit: "total" },
    { label: "Calories", icon: Flame, color: "text-destructive", value: totalCalories.toLocaleString(), unit: "burned" },
    { label: "XP Earned", icon: Star, color: "text-amber-500", value: xp.toLocaleString(), unit: "points" },
  ];

  const heatmap = getWeekHeatmap(workouts);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <h3 className="text-sm font-display font-bold text-muted-foreground uppercase tracking-wider">Stats</h3>

      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 + i * 0.08 }}
          className="bg-card rounded-xl border border-border p-4 shadow-card"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xl font-display font-bold text-foreground leading-tight">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.unit}</p>
            </div>
          </div>
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card rounded-xl border border-border p-4 shadow-card text-center"
      >
        <p className="text-xs text-muted-foreground mb-1">Current Rank</p>
        <p className="text-lg font-display font-bold text-foreground">{current.name}</p>
      </motion.div>

      {/* Weekly activity heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-card rounded-xl border border-border p-4 shadow-card"
      >
        <p className="text-xs text-muted-foreground mb-2 font-medium">This Week</p>
        <div className="flex items-center justify-between gap-1">
          {dayLabels.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={`w-6 h-6 rounded-md transition-colors ${
                  heatmap[i] ? "gradient-hero" : "bg-muted"
                }`}
              />
              <span className="text-[9px] text-muted-foreground">{day}</span>
            </div>
          ))}
        </div>
        
      </motion.div>
       <RateUsBadge />
    </motion.div>
    
  );
};
