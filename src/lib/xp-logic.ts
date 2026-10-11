// XP per completed set
export const XP_PER_SET = 5;

// XP bonus when completing entire day
export const DAY_COMPLETION_BONUS = 50;

// XP bonus when completing entire plan (all days)
export const PLAN_COMPLETION_BONUS = 100;

// Calculate XP for a single set completion
export function calculateSetXP(): number {
  return XP_PER_SET;  // 5 XP per set
}

// Calculate XP for day completion (bonus, not included in set XP)
export function calculateDayCompletionBonus(totalExercises: number): number {
  return DAY_COMPLETION_BONUS;  // 50 XP bonus when day finishes
}

// Calculate XP for plan completion (bonus, not included in set XP)
export function calculatePlanCompletionBonus(): number {
  return PLAN_COMPLETION_BONUS;  // 100 XP bonus when entire plan finishes
}

// (Keep existing functions)
export const rankTiers = [
  { name: "Rookie", minXP: 0 },
  { name: "Bronze", minXP: 100 },
  { name: "Silver", minXP: 500 },
  { name: "Gold", minXP: 1500 },
  { name: "Platinum", minXP: 5000 },
  { name: "Diamond", minXP: 15000 },
] as const;

export function calculateLevel(xp: number): number {
  return Math.floor(xp / 200) + 1;
}

export function getRankName(xp: number): string {
  for (let i = rankTiers.length - 1; i >= 0; i--) {
    if (xp >= rankTiers[i].minXP) return rankTiers[i].name;
  }
  return "Rookie";
}

export function getRankProgress(xp: number) {
  let currentIdx = 0;
  for (let i = rankTiers.length - 1; i >= 0; i--) {
    if (xp >= rankTiers[i].minXP) {
      currentIdx = i;
      break;
    }
  }
  const current = rankTiers[currentIdx];
  const next = rankTiers[currentIdx + 1] || null;
  const progress = next
    ? ((xp - current.minXP) / (next.minXP - current.minXP)) * 100
    : 100;
  return { current, next, progress: Math.min(progress, 100), currentIdx };
}

export function getProgressToNextLevel(xp: number): number {
  const xpInCurrentLevel = xp % 200;
  return (xpInCurrentLevel / 200) * 100;
}