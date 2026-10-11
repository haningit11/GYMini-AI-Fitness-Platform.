import { Award, Flame, Target, Zap, Dumbbell, Trophy, Star, Crown } from "lucide-react";

interface MilestoneBadgesProps {
  totalVolume: number;
  streak: number;
  totalWorkouts: number;
  xp: number;
}

const badges = [
  { id: "volume10k", label: "10k Volume Club", icon: Dumbbell, condition: (p: MilestoneBadgesProps) => p.totalVolume >= 10000 },
  { id: "streak7", label: "7-Day Streak", icon: Flame, condition: (p: MilestoneBadgesProps) => p.streak >= 7 },
  { id: "workouts25", label: "25 Workouts", icon: Target, condition: (p: MilestoneBadgesProps) => p.totalWorkouts >= 25 },
  { id: "xp5000", label: "5000 XP", icon: Zap, condition: (p: MilestoneBadgesProps) => p.xp >= 5000 },
  { id: "volume50k", label: "50k Volume", icon: Trophy, condition: (p: MilestoneBadgesProps) => p.totalVolume >= 50000 },
  { id: "streak30", label: "30-Day Streak", icon: Star, condition: (p: MilestoneBadgesProps) => p.streak >= 30 },
  { id: "workouts100", label: "Century Club", icon: Award, condition: (p: MilestoneBadgesProps) => p.totalWorkouts >= 100 },
  // FIXED: Gold Rank = 1500 XP (from rankTiers), not 10000
  { id: "goldRank", label: "Gold Rank", icon: Crown, condition: (p: MilestoneBadgesProps) => p.xp >= 1500 },
  // OPTIONAL: Add Platinum (5000) and Diamond (15000) too
  { id: "platinumRank", label: "Platinum Rank", icon: Crown, condition: (p: MilestoneBadgesProps) => p.xp >= 5000 },
  { id: "diamondRank", label: "Diamond Rank", icon: Crown, condition: (p: MilestoneBadgesProps) => p.xp >= 15000 },
];

const MilestoneBadges = (props: MilestoneBadgesProps) => (
  <div className="rounded-2xl bg-card border border-border p-6">
    <h2 className="text-lg font-display font-bold text-foreground mb-4">Milestones</h2>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {badges.map((b) => {
        const unlocked = b.condition(props);
        return (
          <div
            key={b.id}
            className={`rounded-xl border p-4 text-center transition-all ${
              unlocked
                ? "border-border bg-accent"
                : "border-border bg-muted/50 grayscale opacity-50"
            }`}
          >
            <b.icon className={`w-7 h-7 mx-auto mb-2 ${unlocked ? "text-yellow-400" : "text-muted-foreground"}`} />
            <p className="text-xs font-medium text-foreground">{b.label}</p>
          </div>
        );
      })}
    </div>
  </div>
);

export default MilestoneBadges;