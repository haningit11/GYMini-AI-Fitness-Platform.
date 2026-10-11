import { useState } from "react";
import { Flame, Star, ChevronUp, Building2, Edit } from "lucide-react";
import { motion } from "framer-motion";
import { AvatarUpload } from "@/components/AvatarUpload";
import { getRankProgress, calculateLevel } from "@/lib/xp-logic";
import { ChangeGymModal } from "@/components/ChangeGymModal";
import { Button } from "@/components/ui/button";

interface IdentityHeaderProps {
  avatarUrl?: string | null;
  name?: string;
  xp: number;
  rank: string;
  streak: number;
  gymName?: string | null;
}

const rankColorMap: Record<string, { bg: string; text: string }> = {
  Rookie: { bg: "bg-sky-500/15", text: "text-sky-500" },
  Bronze: { bg: "bg-orange-500/15", text: "text-orange-600" },
  Silver: { bg: "bg-slate-400/15", text: "text-slate-500" },
  Gold: { bg: "bg-amber-400/15", text: "text-amber-500" },
  Platinum: { bg: "bg-violet-500/15", text: "text-violet-500" },
  Diamond: { bg: "bg-sky-400/15", text: "text-sky-400" },
};

export const IdentityHeader = ({ avatarUrl, name, xp, rank, streak, gymName }: IdentityHeaderProps) => {
  const { current, next, progress } = getRankProgress(xp);
  const level = calculateLevel(xp);
  const colors = rankColorMap[current.name] || rankColorMap.Rookie;
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [isChangeGymModalOpen, setChangeGymModalOpen] = useState(false);

  const displayAvatar = localAvatar || avatarUrl;

  return (
    <>
      <ChangeGymModal open={isChangeGymModalOpen} onOpenChange={setChangeGymModalOpen} />
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-6 shadow-card"
      >
      <div className="flex items-center gap-5 flex-wrap sm:flex-nowrap">
        {/* Avatar */}
        <AvatarUpload
          avatarUrl={displayAvatar}
          name={name}
          size="lg"
          onUploaded={(url) => setLocalAvatar(url)}
        />

        {/* Name + Rank + Gym */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-display font-bold text-foreground truncate">
              {name || "Champion"}
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              Lv.{level}
            </span>
          </div>

          {/* Rank badge */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}>
              {current.name}
            </span>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={() => setChangeGymModalOpen(true)}>
              <Building2 className="w-3 h-3" />
              {gymName || "No Gym"}
              <Edit className="w-3 h-3 opacity-50" />
            </Button>
          </div>

          {/* XP progress bar toward next rank */}
          {next && (
            <div className="flex items-center gap-2 mt-3 max-w-xs">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full gradient-hero"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 whitespace-nowrap">
                <ChevronUp className="w-3 h-3" />
                {next.name}
              </span>
            </div>
          )}
        </div>

        {/* Streak & XP pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-4 py-3">
            <motion.div
              className="w-10 h-10 rounded-lg gradient-hero flex items-center justify-center shrink-0"
              animate={streak > 3 ? { scale: [1, 1.15, 1] } : undefined}
              transition={streak > 3 ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : undefined}
            >
              <Flame className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            <div>
              <p className="text-xl font-display font-bold text-foreground leading-tight">{streak}</p>
              <p className="text-[10px] text-muted-foreground">day streak</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-4 py-3">
            <Star className={`w-5 h-5 ${colors.text} shrink-0`} />
            <div>
              <p className="text-xl font-display font-bold text-foreground leading-tight">
                {xp.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">XP earned</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
    </>
  );
};
