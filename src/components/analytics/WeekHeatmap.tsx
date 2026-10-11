import { motion } from "framer-motion";

interface WorkoutRow {
  workout_date: string;
  duration: number;
}

interface WeekHeatmapProps {
  workouts: WorkoutRow[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const WeekHeatmap = ({ workouts }: WeekHeatmapProps) => {
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  workouts.forEach((w) => {
    const day = new Date(w.workout_date).getDay();
    dayCounts[day] += w.duration;
  });
  const max = Math.max(...dayCounts, 1);

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
      <h2 className="text-lg font-display font-bold text-foreground mb-1">Weekly Intensity</h2>
      <p className="text-sm text-muted-foreground mb-6">Total training minutes by day of week</p>
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day, i) => {
          const intensity = dayCounts[i] / max;
          return (
            <motion.div
              key={day}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center gap-2"
            >
              <div
                className="w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-colors"
                style={{
                  backgroundColor: intensity > 0
                    ? `hsl(var(--primary) / ${0.15 + intensity * 0.85})`
                    : "hsl(var(--muted))",
                  color: intensity > 0.4 ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                }}
              >
                {dayCounts[i] > 0 ? `${dayCounts[i]}m` : "—"}
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">{day}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekHeatmap;
