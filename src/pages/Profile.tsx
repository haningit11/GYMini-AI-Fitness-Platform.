import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2,
  Flame,
  Dumbbell,
  Target,
  CalendarDays,
  Pencil,
  UserPlus,
  Check,
  BarChart3,
  Users,
  Ruler,
  Weight,
  Zap,
  Trophy,
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface ProfileData {
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  gym_name: string | null;
  level: string | null;
  goal: string | null;
  height: number | null;
  weight: number | null;
  target_weight: number | null;
  primary_muscle: string | null;
  body_fat_percentage: number | null;
  gender: string | null;
  rank: string;
  xp: number;
  streak: number;
  created_at: string;
}

const rankColors: Record<string, string> = {
  Rookie: "bg-slate-100 text-slate-700",
  "Gym Rat": "bg-sky-100 text-sky-700",
  Pro: "bg-yellow-100 text-yellow-700",
  Diamond: "bg-purple-100 text-purple-700",
};

const goalLabels: Record<string, string> = {
  Bulking: "Bulking",
  Cutting: "Cutting",
  Maintenance: "Maintenance",
};

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const { user, authUser, updateProfile } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const [editHeight, setEditHeight] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editTargetWeight, setEditTargetWeight] = useState("");
  const [editLevel, setEditLevel] = useState("");
  const [editGoal, setEditGoal] = useState("");
  const [editGym, setEditGym] = useState("");
  const [editPrimaryMuscle, setEditPrimaryMuscle] = useState("");
  const [editBodyFat, setEditBodyFat] = useState("");
  const [saving, setSaving] = useState(false);

  const isOwnProfile = !id || id === authUser?.id;
  const targetUserId = isOwnProfile ? authUser?.id : id;

  const blockInvalidKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (!targetUserId) return;
    const fetchData = async () => {
      setLoading(true);
      const [profRes, workoutsRes, followersRes, followingRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", targetUserId).single(),
        supabase
          .from("workouts")
          .select("workout_date")
          .eq("user_id", targetUserId)
          .order("workout_date", { ascending: false }),
        supabase.from("followers").select("id", { count: "exact", head: true }).eq("following_id", targetUserId),
        supabase.from("followers").select("id", { count: "exact", head: true }).eq("follower_id", targetUserId),
      ]);

      if (profRes.data) setProfile(profRes.data as ProfileData);
      setTotalWorkouts(workoutsRes.data?.length ?? 0);
      setFollowersCount(followersRes.count ?? 0);
      setFollowingCount(followingRes.count ?? 0);

      if (authUser && !isOwnProfile) {
        const { data: followRow } = await supabase
          .from("followers")
          .select("id")
          .eq("follower_id", authUser.id)
          .eq("following_id", targetUserId)
          .maybeSingle();
        setIsFollowing(!!followRow);
      }

      setLoading(false);
    };
    fetchData();
  }, [targetUserId, authUser, isOwnProfile]);

  const handleFollow = useCallback(async () => {
    if (!authUser || !targetUserId || followLoading) return;
    setFollowLoading(true);
    if (isFollowing) {
      setIsFollowing(false);
      setFollowersCount((c) => Math.max(0, c - 1));
      const { error } = await supabase
        .from("followers")
        .delete()
        .eq("follower_id", authUser.id)
        .eq("following_id", targetUserId);
      if (error) {
        setIsFollowing(true);
        setFollowersCount((c) => c + 1);
      }
    } else {
      setIsFollowing(true);
      setFollowersCount((c) => c + 1);
      const { error } = await supabase
        .from("followers")
        .insert({ follower_id: authUser.id, following_id: targetUserId });
      if (error) {
        setIsFollowing(false);
        setFollowersCount((c) => Math.max(0, c - 1));
      }
    }
    setFollowLoading(false);
  }, [authUser, targetUserId, isFollowing, followLoading]);

  const openEdit = () => {
    if (!profile) return;
    setEditHeight(profile.height?.toString() ?? "");
    setEditWeight(profile.weight?.toString() ?? "");
    setEditTargetWeight(profile.target_weight?.toString() ?? "");
    setEditLevel(profile.level ?? "");
    setEditGoal(profile.goal ?? "");
    setEditGym(profile.gym_name ?? "");
    setEditPrimaryMuscle(profile.primary_muscle ?? "");
    setEditBodyFat(profile.body_fat_percentage?.toString() ?? "");
    setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const newWeight = editWeight ? parseFloat(editWeight) : undefined;
    const newBodyFat = editBodyFat ? parseFloat(editBodyFat) : undefined;
    await updateProfile({
      height: editHeight ? parseFloat(editHeight) : undefined,
      weight: newWeight,
      targetWeight: editTargetWeight ? parseFloat(editTargetWeight) : undefined,
      level: editLevel,
      goal: editGoal,
      gymName: editGym,
      primaryMuscle: editPrimaryMuscle,
      bodyFatPercentage: newBodyFat,
    });

    // Log to body_measurements if weight or body fat changed
    const weightChanged = newWeight !== undefined && newWeight !== profile?.weight;
    const bodyFatChanged = newBodyFat !== undefined && newBodyFat !== profile?.body_fat_percentage;
    if (authUser && (weightChanged || bodyFatChanged)) {
      await supabase.from("body_measurements").upsert({
        user_id: authUser.id,
        measured_at: new Date().toISOString().split("T")[0],
        weight: newWeight ?? null,
        body_fat_percentage: newBodyFat ?? null,
      }, { onConflict: "user_id,measured_at" });
    }

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            height: editHeight ? parseFloat(editHeight) : null,
            weight: editWeight ? parseFloat(editWeight) : null,
            target_weight: editTargetWeight ? parseFloat(editTargetWeight) : null,
            level: editLevel,
            goal: editGoal,
            gym_name: editGym,
            primary_muscle: editPrimaryMuscle,
            body_fat_percentage: editBodyFat ? parseFloat(editBodyFat) : null,
          }
        : prev,
    );
    setSaving(false);
    setEditOpen(false);
    toast({ title: "Profile and metrics updated!" });
  };

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-24 text-center">
        <p className="text-muted-foreground">User not found.</p>
        <Link to="/dashboard" className="text-primary underline mt-4 inline-block">
          Go home
        </Link>
      </div>
    );
  }

  const rankColor = rankColors[profile.rank] || rankColors.Rookie;
  const streakValue = isOwnProfile ? (user?.streak ?? profile.streak ?? 0) : (profile.streak ?? 0);

  return (
    <div>
      {/* Banner */}
      <div>
        <div className="h-48 md:h-56 gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute bottom-4 right-6 opacity-20">
            <Dumbbell className="w-32 h-32 text-white" />
          </div>
        </div>

        {/* Avatar + Name row */}
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="relative -mt-16 flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 pb-6 border-b border-border">
            <Avatar className="w-32 h-32 border-4 border-background shadow-2xl shrink-0">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="gradient-hero text-primary-foreground text-4xl font-display font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">{profile.name}</h1>
                <Badge className={`${rankColor} border-0 font-semibold`}>
                  <Trophy className="w-3 h-3 mr-1" />
                  {profile.rank}
                </Badge>
                {profile.gender && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {profile.gender}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-1 text-sm text-muted-foreground mb-3">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Member since {profile.created_at ? format(new Date(profile.created_at), "MMM yyyy") : ""}</span>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-5">
                <div className="text-center">
                  <p className="font-bold text-foreground">{followersCount}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <p className="font-bold text-foreground">{followingCount}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <p className="font-bold text-foreground">{totalWorkouts}</p>
                  <p className="text-xs text-muted-foreground">Workouts</p>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              {isOwnProfile ? (
                <Button onClick={openEdit} variant="outline" className="gap-2 rounded-2xl">
                  <Pencil className="w-4 h-4" /> Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2 rounded-2xl">
                    <BarChart3 className="w-4 h-4" /> Compare
                  </Button>
                  <Button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`gap-2 rounded-2xl ${isFollowing ? "" : "gradient-hero text-primary-foreground border-0"}`}
                    variant={isFollowing ? "outline" : "default"}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="w-4 h-4" /> Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" /> Follow
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-6 max-w-4xl py-8 space-y-6">
        {/* XP + Streak banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { icon: Zap, label: "Total XP", value: profile.xp.toLocaleString(), color: "text-primary" },
            { icon: Flame, label: "Streak", value: `${streakValue} days`, color: "text-orange-500" },
            { icon: Dumbbell, label: "Workouts", value: totalWorkouts, color: "text-secondary" },
            {
              icon: Target,
              label: "Goal",
              value: profile.goal || "Not set",
              color: "text-muted-foreground",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-card rounded-2xl border border-border p-5 text-center shadow-card"
            >
              <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
              <p className="text-xl font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Body Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl border border-border p-6 shadow-card"
          >
            <h2 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Ruler className="w-4 h-4 text-primary" /> Body Stats
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Height", value: profile.height ? `${profile.height} cm` : "—" },
                { label: "Weight", value: profile.weight ? `${profile.weight} kg` : "—" },
                { label: "Target Weight", value: profile.target_weight ? `${profile.target_weight} kg` : "—" },
                { label: "Body Fat", value: profile.body_fat_percentage ? `${profile.body_fat_percentage}%` : "—" },
              ].map((item) => (
                <div key={item.label} className="bg-muted rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
                  <p className="font-semibold text-foreground text-sm">{item.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Training Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-2xl border border-border p-6 shadow-card"
          >
            <h2 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-primary" /> Training
            </h2>
            <div className="space-y-3">
              {[
                { label: "Level", value: profile.level || "—" },
                { label: "Primary Focus", value: profile.primary_muscle || "—" },
                { label: "Gym", value: profile.gym_name || "Home / Not set" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-semibold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Height (cm)</Label>
                <Input
                  type="number"
                  value={editHeight}
                  onKeyDown={blockInvalidKeys}
                  onChange={(e) => setEditHeight(e.target.value)}
                  placeholder="175"
                  className="mt-1"
                 
                />
              </div>
              <div>
                <Label className="text-xs">Weight (kg)</Label>
                <Input
                  type="number"
                  value={editWeight}
                  onKeyDown={blockInvalidKeys}
                  onChange={(e) => setEditWeight(e.target.value)}
                  placeholder="70"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Target Weight (kg)</Label>
                <Input
                  type="number"
                  value={editTargetWeight}
                  onKeyDown={blockInvalidKeys}
                  onChange={(e) => setEditTargetWeight(e.target.value)}
                  placeholder="75"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Body Fat %</Label>
                <Input
                  type="number"
                  value={editBodyFat}
                  onKeyDown={blockInvalidKeys}
                  onChange={(e) => setEditBodyFat(e.target.value)}
                  placeholder="18"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Level</Label>
              <Select value={editLevel} onValueChange={setEditLevel}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Goal</Label>
              <Select value={editGoal} onValueChange={setEditGoal}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bulking">Bulking</SelectItem>
                  <SelectItem value="Cutting">Cutting</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Primary Muscle Focus</Label>
              <Select value={editPrimaryMuscle} onValueChange={setEditPrimaryMuscle}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select muscle" />
                </SelectTrigger>
                <SelectContent>
                  {["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Full Body"].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Gym Name</Label>
              <Input
                value={editGym}
                disabled
                placeholder="Your gym"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} className="rounded-2xl">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-2xl gradient-hero text-primary-foreground border-0"
            >
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
