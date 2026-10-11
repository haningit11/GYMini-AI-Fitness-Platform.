import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Database, AlertTriangle, Activity, Download, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type SystemStats = {
  totalUsers: number;
  totalWorkouts: number;
  totalGyms: number;
  dbSize: string;
  lastBackup: string | null;
};

const AdminSettings = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [users, workouts, gyms] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("workouts").select("id", { count: "exact", head: true }),
        supabase.from("gyms").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        totalUsers: users.count ?? 0,
        totalWorkouts: workouts.count ?? 0,
        totalGyms: gyms.count ?? 0,
        dbSize: "Calculate via Supabase dashboard",
        lastBackup: "Auto-enabled in Supabase",
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
      toast({
        title: "Error",
        description: "Could not load system stats",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };



  // Export all user data as CSV
  const handleExportUsers = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, rank, xp, level, streak, gym_name, created_at");

      if (error) throw error;

      const csv = [
        ["ID", "Name", "Email", "Rank", "XP", "Level", "Streak", "Gym", "Created"],
        ...(data?.map((u: any) => [
          u.id,
          u.name || "—",
          u.email,
          u.rank,
          u.xp,
          u.level || "—",
          u.streak,
          u.gym_name || "—",
          new Date(u.created_at).toLocaleDateString(),
        ]) || []),
      ]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gymini-users-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Exported",
        description: `${data?.length || 0} users exported to CSV`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  // Export all workouts as CSV
  const handleExportWorkouts = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from("workouts")
        .select("id, user_id, type, duration, calories, workout_date")
        .order("workout_date", { ascending: false })
        .limit(1000);

      if (error) throw error;

      const csv = [
        ["ID", "User", "Type", "Duration (min)", "Calories", "Date"],
        ...(data?.map((w: any) => [
          w.id,
          w.user_id.slice(0, 8),
          w.type || "—",
          w.duration || "—",
          w.calories || "—",
          new Date(w.workout_date).toLocaleDateString(),
        ]) || []),
      ]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gymini-workouts-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Exported",
        description: `${data?.length || 0} workouts exported to CSV (max 1000)`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  // Export all site reviews as CSV
  const handleExportReviews = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from("site_reviews")
        .select("id, user_id, rating, comment, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const csv = [
        ["ID", "User", "Rating", "Comment", "Date"],
        ...(data?.map((r: any) => [
          r.id,
          r.user_id.slice(0, 8),
          r.rating,
          (r.comment || "").replace(/"/g, '""'), // Escape quotes in comments
          new Date(r.created_at).toLocaleDateString(),
        ]) || []),
      ]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gymini-reviews-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Exported",
        description: `${data?.length || 0} reviews exported to CSV`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  // Export system logs as CSV
  const handleExportLogs = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from("system_logs")
        .select("id, user_id, action, details, created_at")
        .order("created_at", { ascending: false })
        .limit(5000); // Logs can be large, limit to 5000

      if (error) throw error;

      const csv = [
        ["ID", "User", "Action", "Details", "Date"],
        ...(data?.map((l: any) => [
          l.id,
          l.user_id ? l.user_id.slice(0, 8) : "system",
          l.action,
          JSON.stringify(l.details).replace(/"/g, '""'),
          new Date(l.created_at).toLocaleDateString(),
        ]) || []),
      ]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gymini-logs-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Exported",
        description: `${data?.length || 0} logs exported to CSV (max 5000)`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  // Clear old logs (keep last 30 days)
  const handleClearOldLogs = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error } = await supabase
        .from("system_logs")
        .delete()
        .lt("created_at", thirtyDaysAgo.toISOString());

      if (error) throw error;

      toast({
        title: "Logs Cleaned",
        description: "Logs older than 30 days have been deleted",
      });
    } catch (error: any) {
      toast({
        title: "Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-1">
          <Settings className="w-6 h-6 text-primary" /> System Settings
        </h1>
        <p className="text-muted-foreground">
          Manage Users, Workouts, Reviews, and System Logs. Export data, and monitor database health.
        </p>
      </div>

      {/* System Stats Card */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" /> System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold mt-1">{stats.totalUsers.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Gyms</p>
                <p className="text-2xl font-bold mt-1">{stats.totalGyms.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Workouts Logged</p>
                <p className="text-2xl font-bold mt-1">{stats.totalWorkouts.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Backup Status</p>
                <Badge className="mt-2 bg-green-500/15 text-green-500 border-green-500/30">
                  Auto-enabled
                </Badge>
              </div>
            </div>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            className="mt-4 gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" /> Data Export
          </CardTitle>
          <CardDescription>
            Download your data as CSV for backup, analysis, and compliance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            ℹ️ Download all data in CSV format for backups, data analysis, or compliance needs.
            System logs can be large (limited to 5000 rows).
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={handleExportUsers}
              disabled={exporting}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {exporting ? "Exporting..." : "Export Users"}
            </Button>
            <Button
              variant="outline"
              onClick={handleExportWorkouts}
              disabled={exporting}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {exporting ? "Exporting..." : "Export Workouts"}
            </Button>
            <Button
              variant="outline"
              onClick={handleExportReviews}
              disabled={exporting}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {exporting ? "Exporting..." : "Export Reviews"}
            </Button>
            <Button
              variant="outline"
              onClick={handleExportLogs}
              disabled={exporting}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {exporting ? "Exporting..." : "Export Logs"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Database Maintenance */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" /> Database Maintenance
          </CardTitle>
          <CardDescription>Dangerous operations. Use with caution.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30 space-y-2">
            <p className="text-sm font-medium">Clear Old Logs (30+ days)</p>
            <p className="text-xs text-muted-foreground">
              Keeps your database lean by deleting system logs older than 30 days. Backups
              are maintained by Supabase.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearOldLogs}
              className="gap-2 mt-2"
            >
              <Trash2 className="w-4 h-4" /> Clear Old Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Database Info */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Database className="w-4 h-4 text-muted-foreground" /> Database Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-border/50">
            <span className="text-muted-foreground">Database</span>
            <span className="font-mono">Supabase PostgreSQL</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/50">
            <span className="text-muted-foreground">Backups</span>
            <span>Auto-enabled (Supabase)</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">View Size</span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs text-primary"
              onClick={() =>
                window.open(
                  "https://app.supabase.com/project/_/settings/billing/usage",
                  "_blank"
                )
              }
            >
              Check Supabase Dashboard →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;