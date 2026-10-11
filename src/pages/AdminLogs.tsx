import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollText, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface LogEntry {
  id: string;
  user_id: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

const actionColors: Record<string, string> = {
  login: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  login_failed: "bg-destructive/15 text-destructive border-destructive/30",
  logout: "bg-muted text-muted-foreground border-border",
  role_change: "bg-primary/15 text-primary border-primary/30",
  gym_verified: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  gym_owner_assigned: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  profile_update: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  user_suspended: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
user_deleted: "bg-red-500/15 text-red-400 border-red-500/30",
};

const AdminLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, string>>({});

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("system_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    const entries = (data ?? []) as LogEntry[];
    setLogs(entries);

    // Fetch profile names for user_ids
    const userIds = [...new Set(entries.map((l) => l.user_id).filter(Boolean))] as string[];
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", userIds);
      const map: Record<string, string> = {};
      profileData?.forEach((p) => {
        map[p.user_id] = p.name || p.email;
      });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const actions = [...new Set(logs.map((l) => l.action))];

  const filtered = logs.filter((log) => {
    if (filterAction && log.action !== filterAction) return false;
    if (search) {
      const term = search.toLowerCase();
      const userName = log.user_id ? (profiles[log.user_id] ?? "").toLowerCase() : "";
      const detailStr = JSON.stringify(log.details).toLowerCase();
      return (
        log.action.toLowerCase().includes(term) ||
        userName.includes(term) ||
        detailStr.includes(term)
      );
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-primary" /> System Logs
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, action, or details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={`cursor-pointer ${!filterAction ? "bg-primary text-primary-foreground" : ""}`}
                onClick={() => setFilterAction(null)}
              >
                All
              </Badge>
              {actions.map((action) => (
                <Badge
                  key={action}
                  variant="outline"
                  className={`cursor-pointer ${filterAction === action ? actionColors[action] ?? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setFilterAction(filterAction === action ? null : action)}
                >
                  {action.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No logs found.</p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={actionColors[log.action] ?? ""}>
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.user_id ? profiles[log.user_id] ?? log.user_id.slice(0, 8) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {Object.keys(log.details).length > 0
                          ? Object.entries(log.details)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(", ")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="text-xs text-muted-foreground text-right">
            Showing {filtered.length} of {logs.length} entries
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogs;
