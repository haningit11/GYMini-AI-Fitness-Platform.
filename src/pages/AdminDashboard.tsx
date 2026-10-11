import { useState, useEffect, useMemo } from "react";
import { Users, Activity, TrendingUp, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import SignupChart from "@/components/admin/SignupChart";

interface ProfileRow {
  id: string;
  user_id: string;
  name: string;
  email: string;
  created_at: string;
  onboarded: boolean;
}

const AdminDashboard = () => {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [gymCount, setGymCount] = useState(0);
  const [workoutStats, setWorkoutStats] = useState({ total: 0, calories: 0, uniqueUsers: 0, topType: "—" });

  useEffect(() => {
    supabase.from("profiles").select("id, user_id, name, email, created_at, onboarded").then(({ data }) => setProfiles((data as ProfileRow[]) ?? []));
    supabase.from("gyms").select("id", { count: "exact", head: true }).then(({ count }) => setGymCount(count ?? 0));
    supabase.from("workouts").select("*").then(({ data }) => {
      if (!data?.length) return;
      const calories = data.reduce((s, w) => s + (w.calories ?? 0), 0);
      const uniqueUsers = new Set(data.map((w) => w.user_id)).size;
      const types: Record<string, number> = {};
      data.forEach((w) => { types[w.type] = (types[w.type] || 0) + 1; });
      const topType = Object.entries(types).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
      setWorkoutStats({ total: data.length, calories, uniqueUsers, topType });
    });
  }, []);

  const statCards = [
    { label: "Total Users", value: profiles.length, icon: Users },
    { label: "Total Gyms", value: gymCount, icon: Building2 },
    { label: "Total Workouts", value: workoutStats.total, icon: Activity },
    { label: "Active Users", value: workoutStats.uniqueUsers, icon: TrendingUp },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold text-foreground mb-1">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm">Platform overview and management.</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-border">
              <CardContent className="p-4">
                <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center mb-2">
                  <s.icon className="w-4 h-4 text-primary-foreground" />
                </div>
                <p className="text-xl font-display font-bold text-foreground">{s.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardContent className="p-4 space-y-2">
            <p className="text-[11px] text-muted-foreground">Calories Burned (Platform)</p>
            <p className="text-2xl font-display font-bold text-foreground">{workoutStats.calories.toLocaleString()}</p>
          </CardContent>
        </Card>
        <SignupChart profiles={profiles as any} />
      </div>
    </div>
  );
};

export default AdminDashboard;
