import { TrendingUp, TrendingDown, AlertTriangle, Calendar, Brain } from "lucide-react";
import { motion } from "framer-motion";

interface WorkoutRow {
  workout_date: string;
  duration: number;
  exercises: unknown;
}

interface AIInsightsProps {
  workouts: WorkoutRow[];
  muscleGroupCounts: Record<string, number>;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const AIInsights = ({ workouts, muscleGroupCounts }: AIInsightsProps) => {
  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay());
  startOfThisWeek.setHours(0, 0, 0, 0);

  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  const thisWeek = workouts.filter((w) => new Date(w.workout_date) >= startOfThisWeek).length;
  const lastWeek = workouts.filter((w) => {
    const d = new Date(w.workout_date);
    return d >= startOfLastWeek && d < startOfThisWeek;
  }).length;

  const pctChange = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : thisWeek > 0 ? 100 : 0;
  const isUp = pctChange >= 0;

  // Balance check
  const totalExercises = Object.values(muscleGroupCounts).reduce((a, b) => a + b, 0);
  const weakGroups = totalExercises > 0
    ? Object.entries(muscleGroupCounts).filter(([, v]) => v / totalExercises < 0.1).map(([k]) => k)
    : [];
  const missingGroups = ["Legs", "Back", "Chest", "Arms", "Core", "Shoulders"].filter(
    (g) => !muscleGroupCounts[g] && totalExercises > 5
  );
  const alertGroups = [...new Set([...weakGroups, ...missingGroups])];

  // Peak day
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  workouts.forEach((w) => dayCounts[new Date(w.workout_date).getDay()]++);
  const peakDayIdx = dayCounts.indexOf(Math.max(...dayCounts));

  const cards = [
    {
      icon: isUp ? TrendingUp : TrendingDown,
      title: "Consistency",
      color: isUp ? "text-secondary" : "text-destructive",
      bg: isUp ? "bg-secondary/10" : "bg-destructive/10",
      text: `You've worked out ${thisWeek} time${thisWeek !== 1 ? "s" : ""} this week — ${isUp ? "up" : "down"} ${Math.abs(pctChange)}% from last week.`,
    },
    {
      icon: AlertTriangle,
      title: "Balance",
      color: alertGroups.length > 0 ? "text-gold" : "text-secondary",
      bg: alertGroups.length > 0 ? "bg-gold/10" : "bg-secondary/10",
      text: alertGroups.length > 0
        ? `⚠️ ${alertGroups.join(", ")} ${alertGroups.length === 1 ? "is" : "are"} undertrained. Mix it up!`
        : "Great balance across all muscle groups. Keep it up!",
    },
    {
      icon: Calendar,
      title: "Peak Performance",
      color: "text-primary",
      bg: "bg-primary/10",
      text: workouts.length > 0
        ? `Your most active day is ${DAYS[peakDayIdx]} with ${dayCounts[peakDayIdx]} workout${dayCounts[peakDayIdx] !== 1 ? "s" : ""}.`
        : "Complete more workouts to see your peak day.",
    },
  ];

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-display font-bold text-foreground">AI Insights</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-xl ${card.bg} p-4 border border-border`}
          >
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`w-4 h-4 ${card.color}`} />
              <span className="font-display font-bold text-sm text-foreground">{card.title}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{card.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AIInsights;
