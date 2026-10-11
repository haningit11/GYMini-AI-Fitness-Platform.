import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TrendIndicator } from "./TrendIndicator";
import { LeaderboardEntry, rankConfig, podiumColors, getXpProgress } from "./types";

interface PodiumProps {
  top3: LeaderboardEntry[];
  myGym?: string | null;
}

export const Podium = ({ top3, myGym }: PodiumProps) => {
  return (
    <div className="flex items-end justify-center gap-3 mb-10">
      {[1, 0, 2].map((idx) => {
        const entry = top3[idx];
        if (!entry) return null;
        const position = idx + 1;
        const isFirst = position === 1;
        const rc = rankConfig[entry.rank] || rankConfig.Rookie;
        const progress = getXpProgress(entry.xp);
        const isGymMate = myGym && entry.gym_name && entry.gym_name === myGym;

        return (
          <motion.div
            key={entry.user_id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.1 }}
            className={`flex flex-col items-center ${isFirst ? "order-2" : idx === 0 ? "order-1" : "order-3"}`}
          >
            {isFirst && <Crown className="w-7 h-7 text-amber-400 mb-1 drop-shadow" />}
            <Link to={`/profile/${entry.user_id}`} className="relative group">
              <div className={`relative ${isFirst ? "podium-glow" : ""}`}>
                <Avatar className={`${isFirst ? "w-20 h-20" : "w-16 h-16"} ring-4 ring-offset-2 ring-offset-background ${isFirst ? "ring-amber-400" : position === 2 ? "ring-slate-300" : "ring-orange-600"} transition-transform group-hover:scale-105`}>
                  <AvatarImage src={entry.avatar_url || undefined} alt={entry.name} />
                  <AvatarFallback className={`bg-gradient-to-br ${podiumColors[position - 1]} text-white font-display font-bold ${isFirst ? "text-2xl" : "text-lg"}`}>
                    {entry.name?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br ${podiumColors[position - 1]} flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
                  {position}
                </div>
              </div>
            </Link>
            <div className="flex items-center gap-1 mt-3">
              <TrendIndicator trend={entry.trend || "same"} />
              <Link to={`/profile/${entry.user_id}`} className="font-display font-bold text-foreground text-sm truncate max-w-[100px] hover:text-primary transition-colors">
                {entry.name || "—"}
              </Link>
            </div>
            {isGymMate && (
              <span className="text-[9px] font-bold text-secondary bg-secondary/15 px-1.5 py-0.5 rounded-full mt-0.5">Gym Mate</span>
            )}
            <Badge className={`${rc.bg} ${rc.color} border-0 text-[10px] mt-1`}>{entry.rank}</Badge>
            <div className="w-16 mt-1.5">
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full gradient-hero"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">{entry.xp.toLocaleString()} XP</p>
          </motion.div>
        );
      })}
    </div>
  );
};
