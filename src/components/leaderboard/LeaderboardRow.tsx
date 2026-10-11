import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrendIndicator } from "./TrendIndicator";
import { RankProgressBadge } from "@/components/RankProgressBadge";
import { LeaderboardEntry, rankConfig, getXpProgress } from "./types";

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  position: number;
  isMe: boolean;
  isGymMate: boolean;
  delay: number;
}

export const LeaderboardRow = ({ entry, position, isMe, isGymMate, delay }: LeaderboardRowProps) => {
  const progress = getXpProgress(entry.xp);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`flex items-center gap-4 bg-card rounded-xl border p-4 shadow-card hover:shadow-card-hover transition-shadow ${isMe ? "border-primary ring-1 ring-primary/20" : "border-border"}`}
    >
      <div className="flex items-center gap-1.5 w-10 shrink-0">
        <span className="font-display font-bold text-muted-foreground text-lg">{position}</span>
        <TrendIndicator trend={entry.trend || "same"} />
      </div>
      <Link to={`/profile/${entry.user_id}`} className="shrink-0">
        <Avatar className="w-10 h-10 hover:ring-2 hover:ring-primary/40 transition-all">
          <AvatarImage src={entry.avatar_url || undefined} alt={entry.name} />
          <AvatarFallback className="bg-muted text-foreground font-display font-bold text-sm">
            {entry.name?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link to={`/profile/${entry.user_id}`} className="font-display font-bold text-foreground text-sm truncate hover:text-primary transition-colors">
            {entry.name || "—"}
          </Link>
          {isMe && <span className="text-[10px] text-primary font-normal">(You)</span>}
          {isGymMate && (
            <span className="text-[9px] font-bold text-secondary bg-secondary/15 px-1.5 py-0.5 rounded-full">Gym Mate</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <RankProgressBadge xp={entry.xp} rank={entry.rank} compact />
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="font-mono font-bold text-foreground text-sm">{entry.xp.toLocaleString()}</p>
        <p className="text-[10px] text-muted-foreground">XP</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
        <Flame className="w-3 h-3" />
        {entry.streak}
      </div>
    </motion.div>
  );
};
