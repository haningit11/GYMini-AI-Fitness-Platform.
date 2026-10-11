import { useState, useMemo, useEffect } from "react";
import {
  Filter,
  Search,
  Users,
  Trophy,
  Target,
  MessageSquare,
  Hash,
  Mail,
  SlidersHorizontal,
  Building2,
  X,
  Lock,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useUnreadDMs } from "@/hooks/useUnreadDMs";
import { useIsMobile } from "@/hooks/use-mobile";
import GymChat from "@/components/chat/GymChat";
import DirectMessages from "@/components/chat/DirectMessages";
import SignInRequiredModal from "@/components/SignInRequiredModal";
import { rankTiers, getRankProgress } from "@/lib/xp-logic";
import { toast } from "sonner";

interface CommunityUser {
  user_id: string;
  name: string;
  level: string;
  rank: string;
  goal: string;
  gym_id: string | null;
  gym_name: string;
  xp: number;
  last_activity_date: string | null;
  gender: string | null;
  primary_muscle: string | null;
}

const tierStyles: Record<string, { color: string; accent: string; ring: string }> = {
  Rookie: { color: "bg-muted", accent: "text-muted-foreground", ring: "ring-muted" },
  Bronze: { color: "bg-orange-600/15", accent: "text-orange-700", ring: "ring-orange-600" },
  Silver: { color: "bg-slate-400/15", accent: "text-slate-400", ring: "ring-slate-400" },
  Gold: { color: "bg-amber-500/15", accent: "text-amber-500", ring: "ring-amber-400" },
  Platinum: { color: "bg-violet-500/15", accent: "text-violet-400", ring: "ring-violet-400" },
  Diamond: { color: "bg-sky-500/15", accent: "text-sky-400", ring: "ring-sky-400" },
};

const rankConfig: Record<string, { color: string; bg: string; border: string }> = {
  Rookie: { color: "text-muted-foreground", bg: "bg-muted", border: "border-t-muted" },
  Bronze: { color: "text-orange-700", bg: "bg-orange-600/15", border: "border-t-orange-600" },
  Silver: { color: "text-slate-400", bg: "bg-slate-400/15", border: "border-t-slate-400" },
  Gold: { color: "text-amber-500", bg: "bg-amber-500/15", border: "border-t-amber-400" },
  Platinum: { color: "text-violet-400", bg: "bg-violet-500/15", border: "border-t-violet-400" },
  Diamond: { color: "text-sky-400", bg: "bg-sky-500/15", border: "border-t-sky-400" },
};

function getXpProgress(xp: number) {
  const { progress } = getRankProgress(xp);
  return progress;
}

function isOnline(lastActivityDate: string | null): boolean {
  if (!lastActivityDate) return false;
  return lastActivityDate === new Date().toISOString().slice(0, 10);
}

const Community = () => {
  const { user, authUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [gymFilter, setGymFilter] = useState("all");
  const [rankFilters, setRankFilters] = useState<string[]>([]);
  const [goalFilter, setGoalFilter] = useState("all");
  const [communityUsers, setCommunityUsers] = useState<CommunityUser[]>([]);
  const [activeTab, setActiveTab] = useState("feed");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalFeature, setAuthModalFeature] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [gymVerified, setGymVerified] = useState<boolean | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [accessPassword, setAccessPassword] = useState("");
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [verifiedGyms, setVerifiedGyms] = useState<string[]>([]);
  const unreadDMs = useUnreadDMs();

// REPLACE THIS SECTION IN YOUR Community.tsx

useEffect(() => {
  const fetchCommunityData = async () => {
    try {
      // VERIFIED GYMS
      const { data: verifiedGymsData } = await supabase
        .from("gyms")
        .select("name")
        .eq("is_verified", true);
  
      const verifiedGymNames =
        verifiedGymsData?.map((g) => g.name) || [];
  
      setVerifiedGyms(verifiedGymNames);

      // 1. Get Admin IDs
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      // Clean the IDs: remove spaces and make lowercase just in case
      const adminIds = adminRoles?.map(r => r.user_id.trim().toLowerCase()) || [];
      
      console.log("Current Admin IDs in DB:", adminIds);

      // 2. Fetch profiles WITH JOIN to gyms table for CURRENT gym names
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          user_id, 
          name, 
          level, 
          rank, 
          goal, 
          gym_id, 
          xp, 
          last_activity_date, 
          gender, 
          primary_muscle,
          gyms (name)
        `);

      if (error) throw error;

      if (data) {
        // 3. Map the data and get gym name from JOIN
        const mappedData = (data as any[]).map(profile => ({
          user_id: profile.user_id,
          name: profile.name,
          level: profile.level,
          rank: profile.rank,
          goal: profile.goal,
          gym_id: profile.gym_id,
          gym_name: profile.gyms?.name || "No Gym",  // ← GET FROM GYMS TABLE!
          xp: profile.xp,
          last_activity_date: profile.last_activity_date,
          gender: profile.gender,
          primary_muscle: profile.primary_muscle,
        } as CommunityUser));

        // 4. Filter out admins
        const filteredData = mappedData.filter(profile => {
          const profileId = profile.user_id.trim().toLowerCase();
          const isAnAdmin = adminIds.includes(profileId);
          
          if (profile.name.toLowerCase().includes("admin") || isAnAdmin) {
            console.log(`Checking user ${profile.name}: Is Admin? ${isAnAdmin}`);
          }

          return !isAnAdmin;
        });

        setCommunityUsers(filteredData);
      }
    } catch (err) {
      console.error("Community fetch error:", err);
    }
  };

  fetchCommunityData();
}, []);

  useEffect(() => {
    if (user?.gymId) {
      supabase
        .from("gyms")
        .select("is_verified")
        .eq("id", user.gymId)
        .single()
        .then(({ data }) => {
          setGymVerified(data?.is_verified ?? false);
        });
    } else {
      setGymVerified(null);
    }
  }, [user?.gymId]);

  const gyms = useMemo(() => {
    return ["No Gym", ...verifiedGyms].sort();
  }, [verifiedGyms]);

  const topGyms = useMemo(() => {
    const gymXp: Record<string, number> = {};
  
    for (const u of communityUsers) {
      // ONLY verified gyms
      if (verifiedGyms.includes(u.gym_name)) {
        gymXp[u.gym_name] = (gymXp[u.gym_name] || 0) + u.xp;
      }
    }
  
    return Object.entries(gymXp)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [communityUsers, verifiedGyms]);

  const filteredUsers = useMemo(() => {
    return communityUsers.filter((u) => {
      const matchesSearch = searchQuery === "" || u.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGym = gymFilter === "all" || u.gym_name === gymFilter;
      const matchesRank = rankFilters.length === 0 || rankFilters.includes(u.rank);
      const matchesGoal = goalFilter === "all" || u.goal === goalFilter;
      return matchesSearch && matchesGym && matchesRank && matchesGoal;
    });
  }, [searchQuery, gymFilter, rankFilters, goalFilter, communityUsers]);

  const hasActiveFilters = useMemo(() => {
    return searchQuery !== "" || gymFilter !== "all" || rankFilters.length > 0 || goalFilter !== "all";
  }, [searchQuery, gymFilter, rankFilters, goalFilter]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setGymFilter("all");
    setRankFilters([]);
    setGoalFilter("all");
  };

  const toggleRankFilter = (rankName: string) => {
    setRankFilters((prev) =>
      prev.includes(rankName) ? prev.filter((r) => r !== rankName) : [...prev, rankName],
    );
  };

  const requireAuth = (feature: string) => {
    if (!isAuthenticated) {
      setAuthModalFeature(feature);
      setShowAuthModal(true);
      return true;
    }
    return false;
  };

  const handleProtectedTab = (value: string) => {
    if (value === "gym-chat" || value === "dms") {
      if (!isAuthenticated) {
        requireAuth(value === "gym-chat" ? "join gym chat" : "send direct messages");
        return;
      }
      if (value === "gym-chat") {
        if (!user?.gymId) {
          toast.error("You must join a gym to access the chat.");
          return;
        }
        if (gymVerified === false) {
          // Do not change tab, just let the content handle the message if needed
          // but here we block the tab change to keep user on feed if unverified
          setActiveTab("feed");
          return;
        }
        if (!isPasswordVerified) {
          setShowPasswordDialog(true);
          return;
        }
      }
    }
    setActiveTab(value);
  };

  const verifyGymPassword = async () => {
    if (!user?.gymId) return;
    const { data, error } = await supabase
      .from("gyms")
      .select("access_password")
      .eq("id", user.gymId)
      .single();

    if (error || !data) {
      toast.error("Error verifying gym access.");
      return;
    }

    if (data.access_password === accessPassword) {
      setIsPasswordVerified(true);
      setShowPasswordDialog(false);
      setActiveTab("gym-chat");
      toast.success("Access granted!");
    } else {
      toast.error("Incorrect gym password.");
    }
  };

  const userGym = user?.gymName || "General";

  const filterControls = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={gymFilter} onValueChange={setGymFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All Gyms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Gyms</SelectItem>
            {gyms.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={goalFilter} onValueChange={setGoalFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All Goals" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Goals</SelectItem>
            <SelectItem value="Bulking">Bulking</SelectItem>
            <SelectItem value="Cutting">Cutting</SelectItem>
            <SelectItem value="Maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">
          Filter by Rank
        </label>
        <div className="flex flex-wrap gap-2">
          {rankTiers.map((tier) => {
            const isSelected = rankFilters.includes(tier.name);
            const style = tierStyles[tier.name];
            return (
              <button
                key={tier.name}
                onClick={() => toggleRankFilter(tier.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                  isSelected
                    ? `${style.color} ${style.accent} border-transparent ring-2 ${style.ring} ring-offset-2 ring-offset-background scale-105`
                    : "bg-background border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                <Trophy className={`w-3 h-3 ${isSelected ? style.accent : "text-muted-foreground"}`} />
                {tier.name}
                {isSelected && <X className="w-3 h-3 ml-0.5 opacity-60" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <SignInRequiredModal open={showAuthModal} onOpenChange={setShowAuthModal} feature={authModalFeature} />

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" /> Gym Access Required
            </DialogTitle>
            <DialogDescription>
              Please enter the access password for <strong>{userGym}</strong> to join the chat.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Gym Password"
              value={accessPassword}
              onChange={(e) => setAccessPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verifyGymPassword()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
            <Button onClick={verifyGymPassword} disabled={!accessPassword}>Enter Chat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
            Community <span className="text-gradient-hero">Hub</span>
          </h1>
          <p className="text-muted-foreground text-lg">Find partners, chat with your gym, and message friends.</p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={handleProtectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="feed" className="flex items-center gap-1.5">
              <Users className="w-4 h-4" /> Feed
            </TabsTrigger>
            <TabsTrigger value="gym-chat" className="flex items-center gap-1.5 relative">
              <Hash className="w-4 h-4" /> Gym Chat
              {gymVerified === false && (
                <Lock className="w-3 h-3 ml-1 text-muted-foreground" />
              )}
            </TabsTrigger>
            <TabsTrigger value="dms" className="flex items-center gap-1.5 relative">
              <Mail className="w-4 h-4" /> DMs
              {unreadDMs > 0 && (
                <span className="ml-1 w-4 h-4 rounded-full gradient-hero text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {unreadDMs > 9 ? "9+" : unreadDMs}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-6">
            {gymVerified === false && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-orange-600">Gym Pending Verification</p>
                  <p className="text-xs text-orange-600/80 mt-0.5">
                    Your gym is pending verification. Access to gym chat will be granted once an admin approves it.
                  </p>
                </div>
              </motion.div>
            )}
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 space-y-5">
                {isMobile ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                      <SheetTrigger asChild>
                        <Button variant="outline" className="w-full flex items-center justify-between gap-2 h-11 px-4">
                          <div className="flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4" />
                            <span>Filters</span>
                            {hasActiveFilters && (
                              <Badge className="ml-1 h-5 min-w-5 px-1 flex items-center justify-center gradient-hero text-primary-foreground border-0">
                                {(searchQuery !== "" ? 1 : 0) + (gymFilter !== "all" ? 1 : 0) + rankFilters.length + (goalFilter !== "all" ? 1 : 0)}
                              </Badge>
                            )}
                          </div>
                          <Filter className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
                        <SheetHeader className="mb-4">
                          <div className="flex items-center justify-between">
                            <SheetTitle className="font-display">Filters</SheetTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleClearFilters}
                              disabled={!hasActiveFilters}
                              className="text-xs h-8 text-primary font-bold"
                            >
                              Reset All
                            </Button>
                          </div>
                        </SheetHeader>
                        <div className="space-y-6 py-2">
                          {filterControls}
                          <Button
                            className="w-full gradient-hero text-primary-foreground font-bold h-12"
                            onClick={() => setFilterOpen(false)}
                          >
                            Show {filteredUsers.length} Results
                          </Button>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card rounded-2xl border border-border p-5 shadow-card"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-primary" />
                        <span className="text-sm font-display font-semibold text-foreground text-xs uppercase tracking-wider">Active Filters</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilters}
                        disabled={!hasActiveFilters}
                        className={`text-xs h-8 font-bold ${hasActiveFilters ? "text-primary hover:text-primary/80 hover:bg-primary/5" : "text-muted-foreground"}`}
                      >
                        Clear All
                      </Button>
                    </div>
                    {filterControls}
                  </motion.div>
                )}

                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {filteredUsers.length} member{filteredUsers.length !== 1 ? "s" : ""} found
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  {filteredUsers.map((member, i) => {
                    const rank = rankConfig[member.rank] || rankConfig.Rookie;
                    const online = isOnline(member.last_activity_date);
                    const xpProgress = getXpProgress(member.xp);

                    return (
                      <motion.div
                        key={member.user_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.04 }}
                        onClick={() => navigate(`/profile/${member.user_id}`)}
                        className={`bg-card rounded-2xl border border-border border-t-[5px] ${rank.border} p-5 shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1 cursor-pointer`}
                      >
                        <div className="flex items-start gap-4 mb-3">
                          <div className="relative shrink-0">
                            <div className="w-12 h-12 rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-bold text-sm">
                              {member.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            {online && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-secondary border-2 border-card">
                                <span className="absolute inset-0 rounded-full bg-secondary animate-ping opacity-75" />
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-display font-bold text-foreground truncate">{member.name}</h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge className={`${rank.bg} ${rank.color} border-0 text-xs font-semibold`}>
                                <Trophy className="w-3 h-3 mr-1" />
                                {member.rank}
                              </Badge>
                              {member.primary_muscle && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                  {member.primary_muscle}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>{member.xp.toLocaleString()} XP</span>
                            <span>Next rank</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                              initial={{ width: 0 }}
                              animate={{ width: `${xpProgress}%` }}
                              transition={{ duration: 0.8, delay: 0.2 + i * 0.04, ease: "easeOut" }}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          {member.goal && (
                            <div className="flex items-center gap-2 text-sm">
                              <Target className="w-4 h-4 text-muted-foreground" />
                              <span className="text-foreground font-medium">{member.goal}</span>
                            </div>
                          )}
                          {member.gym_name && (
                            <div className="flex items-center gap-2 text-sm">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground truncate">{member.gym_name}</span>
                            </div>
                          )}
                        </div>

                        {member.user_id !== authUser?.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (requireAuth("send direct messages")) return;
                              setActiveTab("dms");
                            }}
                            className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors py-2 rounded-lg border border-border hover:bg-muted"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Message
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-16">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground font-display font-semibold">No members match your filters</p>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">Try adjusting your search or filters.</p>
                    <Button variant="outline" size="sm" onClick={handleClearFilters}>
                      <Filter className="w-3.5 h-3.5 mr-1.5" /> Clear All Filters
                    </Button>
                  </div>
                )}
              </div>

              {!isMobile && (
                <motion.aside
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="w-72 shrink-0"
                >
                  <div className="bg-card rounded-2xl border border-border p-5 shadow-card sticky top-28">
                    <div className="flex items-center gap-2 mb-4">
                      <Trophy className="w-4 h-4 text-gold" />
                      <span className="font-display font-bold text-foreground text-sm">Top Gyms</span>
                    </div>
                    {topGyms.length === 0 && <p className="text-xs text-muted-foreground">No gym data yet.</p>}
                    <div className="space-y-3">
                      {topGyms.map(([gym, xp], idx) => (
                        <div key={gym} className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? "gradient-hero text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                          >
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{gym}</p>
                            <p className="text-xs text-muted-foreground">{xp.toLocaleString()} XP</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.aside>
              )}
            </div>
          </TabsContent>

          <TabsContent value="gym-chat">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
              style={{ height: "70vh" }}
            >
              <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center gap-2">
                <Hash className="w-4 h-4 text-primary" />
                <span className="font-display font-semibold text-foreground text-sm">{userGym}</span>
                <span className="text-xs text-muted-foreground ml-1">— Gym Chat Room</span>
              </div>
              <div className="h-[calc(100%-48px)]">
                <GymChat room={user?.gymId || ""} />
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="dms">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
              style={{ height: "70vh" }}
            >
              <DirectMessages />
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Community;
