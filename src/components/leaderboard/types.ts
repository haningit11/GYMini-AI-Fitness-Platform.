export interface LeaderboardEntry {
  user_id: string;
  name: string;
  xp: number;
  rank: string;
  streak: number;
  level: string | null;
  avatar_url: string | null;
  gym_name?: string | null;
  trend?: "up" | "down" | "same";
}

export const rankConfig: Record<string, { color: string; bg: string }> = {
  Diamond: { color: "text-sky-400", bg: "bg-sky-500/15" },
  Platinum: { color: "text-violet-400", bg: "bg-violet-500/15" },
  Gold: { color: "text-amber-500", bg: "bg-amber-500/15" },
  Silver: { color: "text-slate-400", bg: "bg-slate-400/15" },
  Bronze: { color: "text-orange-700", bg: "bg-orange-600/15" },
  Rookie: { color: "text-muted-foreground", bg: "bg-muted" },
};

export const podiumColors = [
  "from-amber-400 to-yellow-500",
  "from-slate-300 to-slate-400",
  "from-orange-600 to-amber-700",
];

export const rankThresholds = [
  { name: "Rookie", minXP: 0 },
  { name: "Bronze", minXP: 100 },
  { name: "Silver", minXP: 500 },
  { name: "Gold", minXP: 1500 },
  { name: "Platinum", minXP: 5000 },
  { name: "Diamond", minXP: 15000 },
];

export function getXpProgress(xp: number) {
  let currentIdx = 0;
  for (let i = rankThresholds.length - 1; i >= 0; i--) {
    if (xp >= rankThresholds[i].minXP) { currentIdx = i; break; }
  }
  const next = rankThresholds[currentIdx + 1];
  if (!next) return 100;
  const current = rankThresholds[currentIdx];
  return ((xp - current.minXP) / (next.minXP - current.minXP)) * 100;
}
