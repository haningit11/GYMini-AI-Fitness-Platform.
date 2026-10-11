import { useState, useEffect, useMemo } from "react";
import { Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAction } from "@/lib/systemLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import UserActionMenu from "@/components/admin/UserActionMenu";

interface ProfileRow {
  id: string;
  user_id: string;
  name: string;
  email: string;
  level: string | null;
  goal: string | null;
  gym_name: string | null;
  onboarded: boolean;
  xp: number;
  rank: string;
  created_at: string;
  role?: string;
  gender?: string | null;
  suspended: boolean;  // ← ADD THIS
}

const AdminUsers = () => {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    // Include suspended column in select
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const roleMap: Record<string, string> = {};
    roles?.forEach((r) => {
      const priority: Record<string, number> = { admin: 3, gym_admin: 2, user: 1 };
      if (!roleMap[r.user_id] || (priority[r.role] ?? 0) > (priority[roleMap[r.user_id]] ?? 0)) {
        roleMap[r.user_id] = r.role;
      }
    });
    setProfiles(((data as ProfileRow[]) ?? []).map((p) => ({ ...p, role: roleMap[p.user_id] || "user" })));
    setLoading(false);
  };

  // ===== SUSPEND/UNSUSPEND USER =====
  const handleSuspendUser = async (userId: string, shouldSuspend: boolean) => {
    try {
      // Update suspended column in database
      const { error } = await supabase
        .from("profiles")
        .update({ suspended: shouldSuspend })
        .eq("user_id", userId);

      if (error) {
        toast.error("Failed to update user status");
        return;
      }

      // Update state
      setProfiles((prev) =>
        prev.map((p) =>
          p.user_id === userId ? { ...p, suspended: shouldSuspend } : p
        )
      );

      // Log action
      logAction("user_suspended", {
        targetUserId: userId,
        suspended: shouldSuspend,
      });

      const message = shouldSuspend
        ? "User account suspended. They cannot log in."
        : "User account unsuspended. They can log in again.";
      toast.success(message);
    } catch (err: any) {
      console.error("Suspend error:", err);
      toast.error("Failed to update user status");
    }
  };

  // ===== DELETE USER =====
  const handleDeleteUser = async (userId: string) => {
    try {
      // 1. Clear admin_id from gyms where this user is the admin
      await supabase
        .from("gyms")
        .update({ admin_id: null })
        .eq("admin_id", userId);

      // 2. Delete the user via RPC
      const { error } = await supabase.rpc("delete_user" as any, {
        target_user_id: userId,
      });

      if (error) {
        console.error("Supabase RPC Error:", error);
        toast.error(error.message);
        return;
      }

      // Log action
      logAction("user_deleted", { targetUserId: userId });

      toast.success("User deleted successfully.");
      setProfiles((prev) => prev.filter((p) => p.user_id !== userId));
    } catch (err: any) {
      console.error("Delete user error:", err);
      toast.error("Failed to delete user");
    }
  };

  const filtered = useMemo(() => {
    if (!search) return profiles;
    const q = search.toLowerCase();
    return profiles.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q)
    );
  }, [profiles, search]);

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> User Management
          </CardTitle>
          <div className="relative pt-2">
            <Search className="absolute left-2.5 top-4.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm">
              No users found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Level</TableHead>
                  <TableHead className="text-xs">XP</TableHead>
                  <TableHead className="text-xs">Rank</TableHead>
                  <TableHead className="text-xs">Role</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id} className="h-10">
                    <TableCell className="py-1.5 font-medium text-foreground text-sm">
                      {p.name || "—"}
                    </TableCell>
                    <TableCell className="py-1.5 text-muted-foreground text-xs">
                      {p.email}
                    </TableCell>
                    <TableCell className="py-1.5">
                      {p.level ? (
                        <Badge variant="secondary" className="text-[10px]">
                          {p.level}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-1.5 font-mono text-foreground text-xs">
                      {p.xp}
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Badge variant="outline" className="text-[10px]">
                        {p.rank}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          p.role === "admin"
                            ? "border-primary text-primary"
                            : p.role === "gym_admin"
                              ? "border-orange-500 text-orange-500"
                              : ""
                        }`}
                      >
                        {p.role === "admin"
                          ? "Admin"
                          : p.role === "gym_admin"
                            ? "Gym Admin"
                            : "User"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Badge
                        variant={
                          p.suspended
                            ? "destructive"
                            : p.onboarded
                              ? "default"
                              : "outline"
                        }
                        className="text-[10px]"
                      >
                        {p.suspended ? "Suspended" : p.onboarded ? "Active" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <UserActionMenu
                        userId={p.user_id}
                        isSuspended={p.suspended}
                        onDeleteUser={handleDeleteUser}
                        onSuspendUser={handleSuspendUser}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;