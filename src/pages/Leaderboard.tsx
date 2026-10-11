import { useEffect, useState, useCallback } from "react";
import { Trophy, ChevronLeft, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RankProgressBadge } from "@/components/RankProgressBadge";

import { Podium } from "@/components/leaderboard/Podium";
import { LeaderboardRow } from "@/components/leaderboard/LeaderboardRow";
import { LeaderboardEntry, rankConfig } from "@/components/leaderboard/types";

function assignTrends(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  // Simulate trend based on a hash of user_id for consistency
  return entries.map((e) => {
    const hash = e.user_id.charCodeAt(0) + e.user_id.charCodeAt(e.user_id.length - 1);
    const trends: Array<"up" | "down" | "same"> = ["up", "same", "down"];
    return { ...e, trend: trends[hash % 3] };
  });
}

const Leaderboard = () => {
  const [allTimeEntries, setAllTimeEntries] = useState<LeaderboardEntry[]>([]);
  const [weeklyEntries, setWeeklyEntries] = useState<LeaderboardEntry[]>([]);
  const [followersEntries, setFollowersEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>("all-time");
  const [confettiFired, setConfettiFired] = useState(false);
  const { user, authUser } = useAuth();

  const buildFollowers = useCallback(async (allEntries: LeaderboardEntry[]) => {
    if (!authUser?.id) return;
    const { data: follows } = await supabase
      .from("followers")
      .select("following_id")
      .eq("follower_id", authUser.id);
    if (!follows) return;
    const followingIds = new Set(follows.map((f: any) => f.following_id));
    followingIds.add(authUser.id);
    const filtered = allEntries
      .filter((e) => followingIds.has(e.user_id))
      .sort((a, b) => b.xp - a.xp);
    setFollowersEntries(filtered);
  }, [authUser?.id]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [profilesRes, weeklyRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, name, xp, rank, streak, level, avatar_url, gym_name")
          .order("xp", { ascending: false })
          .limit(50),
        supabase.rpc("weekly_leaderboard" as any),
      ]);

      const allProfiles = (profilesRes.data as any[]) ?? [];
      const profileMap = new Map(allProfiles.map((p: any) => [p.user_id, { avatar_url: p.avatar_url, gym_name: p.gym_name }]));

      const allTime = assignTrends(allProfiles.slice(0, 10) as LeaderboardEntry[]);
      setAllTimeEntries(allTime);

      buildFollowers(assignTrends(allProfiles as LeaderboardEntry[]));

      setWeeklyEntries(
        assignTrends(
          ((weeklyRes.data as any[]) ?? []).map((r: any) => ({
            user_id: r.user_id,
            name: r.name,
            xp: Number(r.weekly_xp),
            rank: r.rank,
            streak: r.streak,
            level: r.level,
            avatar_url: profileMap.get(r.user_id)?.avatar_url || null,
            gym_name: profileMap.get(r.user_id)?.gym_name || null,
          }))
        )
      );
      setLoading(false);

      // Confetti if user is in top 3
      if (authUser?.id) {
        const top3Ids = allProfiles.slice(0, 3).map((p: any) => p.user_id);
        if (top3Ids.includes(authUser.id)) {
          setTimeout(() => {
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
          }, 800);
        }
      }
    };
    fetchData();
  }, [authUser?.id, buildFollowers]);

  const entries = tab === "all-time" ? allTimeEntries : tab === "this-week" ? weeklyEntries : followersEntries;
  const currentUserInList = entries.find((e) => e.user_id === authUser?.id);
  const top3 = tab !== "followers" ? entries.slice(0, 3) : [];
  const rest = tab !== "followers" ? entries.slice(3) : entries;
  const restStartPosition = tab === "followers" ? 1 : 4;
  const myGym = user?.gymName || null;

  return (
    <div>
      <main className="container mx-auto px-6 py-8 max-w-3xl">
        <Link to={authUser ? "/dashboard" : "/"} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> {authUser ? "Back to Dashboard" : "Back to Home"}
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Leaderboard</h1>
          <p className="text-muted-foreground mt-1">Top 10 athletes ranked by XP</p>
        </motion.div>

        <div className="flex justify-center mb-8">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all-time">All Time</TabsTrigger>
              <TabsTrigger value="this-week">This Week</TabsTrigger>
              {authUser && <TabsTrigger value="followers">Followers</TabsTrigger>}
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No users yet</p>
            <p className="text-sm mt-1">Be the first to claim the top spot!</p>
          </div>
        ) : (
          <>
            {tab !== "followers" && top3.length > 0 && (
              <Podium top3={top3} myGym={myGym} />
            )}

            <div className="space-y-2">
              {rest.map((entry, i) => {
                const position = restStartPosition + i;
                const isMe = entry.user_id === authUser?.id;
                const isGymMate = !isMe && !!myGym && entry.gym_name === myGym;

                return (
                  <LeaderboardRow
                    key={entry.user_id}
                    entry={entry}
                    position={position}
                    isMe={isMe}
                    isGymMate={isGymMate}
                    delay={0.3 + i * 0.05}
                  />
                );
              })}
            </div>

            {tab !== "followers" && !currentUserInList && user && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-card rounded-xl border border-primary ring-1 ring-primary/20 p-4 flex items-center gap-4 shadow-card"
              >
                <span className="w-8 text-center font-display font-bold text-muted-foreground text-lg">—</span>
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-muted text-foreground font-display font-bold text-sm">
                    {user.name?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-foreground text-sm truncate flex items-center gap-2">
                    {user.name || "—"}
                    <span className="text-[10px] text-primary font-normal">(You)</span>
                  </p>
                  <Badge className={`${(rankConfig[user.rank || "Rookie"] || rankConfig.Rookie).bg} ${(rankConfig[user.rank || "Rookie"] || rankConfig.Rookie).color} border-0 text-[10px]`}>
                    {user.rank || "Rookie"}
                  </Badge>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono font-bold text-foreground text-sm">{(user.xp || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">XP</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Flame className="w-3 h-3" />
                  {user.streak || 0}
                </div>
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Leaderboard;
