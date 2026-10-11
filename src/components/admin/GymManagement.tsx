import { useState, useEffect } from "react";
import { CheckCircle, Search, UserPlus, Building2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logAction } from "@/lib/systemLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

// Inside GymManagement.tsx
interface Gym {
  id: string;
  name: string;
  location_city: string | null;
  is_verified: boolean;
  admin_id: string | null; // This holds the UUID
  description: string | null;
  created_at: string | null;
  admin_email?: string; // We will add this manually
}

interface Props {
  gyms: Gym[];
  onRefresh: () => void;
}

const GymManagement = ({ gyms, onRefresh }: Props) => {
  const [assignGym, setAssignGym] = useState<Gym | null>(null);
  const [foundUser, setFoundUser] = useState<{ user_id: string; name: string; email: string } | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [adminEmails, setAdminEmails] = useState<Record<string, string>>({});

// Fetch emails whenever the gyms list changes
useEffect(() => {
  const fetchEmails = async () => {
    const ids = gyms.map(g => g.admin_id).filter(Boolean) as string[];
    if (ids.length === 0) return;

    const { data } = await supabase
      .from("profiles")
      .select("user_id, email")
      .in("user_id", ids);

    if (data) {
      const emailMap = data.reduce((acc, curr) => ({
        ...acc,
        [curr.user_id]: curr.email
      }), {});
      setAdminEmails(emailMap);
    }
  };

  fetchEmails();
}, [gyms]);

  // Function to get members of the specific gym
  const fetchGymMembers = async (gymId: string) => {
    setLoadingMembers(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_id, name, email")
      .eq("gym_id", gymId);
    setMembers(data ?? []);
    setLoadingMembers(false);
  };

  const unverified = gyms.filter((g) => !g.is_verified);
  const verifiedGyms = gyms.filter((g) => g.is_verified);

  const handleVerify = async (gymId: string) => {
    const { error } = await supabase.from("gyms").update({ is_verified: true }).eq("id", gymId);
    if (error) {
      toast.error("Failed to verify gym");
      return;
    }
    toast.success("Gym verified!");
    logAction("gym_verified", { gymId, gymName: gyms.find((g) => g.id === gymId)?.name });
    onRefresh();
  };

  const handleDelete = async (gymId: string) => {
    if (!confirm("Are you sure you want to delete this gym? All associated profiles will be unlinked.")) return;
    
    const { error } = await supabase.from("gyms").delete().eq("id", gymId);
    if (error) {
      toast.error("Failed to delete gym");
      return;
    }
    toast.success("Gym deleted!");
    logAction("gym_deleted", { gymId });
    onRefresh();
  };

  const assignAdmin = async () => {
    if (!assignGym || !foundUser) return;
    
    const { error: gymErr } = await supabase
      .from("gyms")
      .update({ admin_id: foundUser.user_id })
      .eq("id", assignGym.id);
        
    if (gymErr) {
      toast.error("Failed to assign admin");
      return;
    }
  
    logAction("gym_owner_assigned", { 
      gymId: assignGym.id, 
      gymName: assignGym.name, 
      assignedUserId: foundUser.user_id 
    });
    
    toast.success(`${foundUser.name || foundUser.email} is now admin of ${assignGym.name}`);
    setAssignGym(null);
    setFoundUser(null);
    onRefresh();
  };

  return (
    <>
      {/* Unverified Gym Requests */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="w-5 h-5 text-primary" /> Gym Requests
            {unverified.length > 0 && (
              <Badge variant="destructive" className="text-[10px] ml-1">{unverified.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unverified.length === 0 ? (
            <p className="text-muted-foreground text-center py-6 text-sm">No pending gym requests.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">City</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs">Created</TableHead>
                  <TableHead className="text-xs w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unverified.map((g) => (
                  <TableRow key={g.id} className="h-10">
                    <TableCell className="py-1.5 font-medium text-foreground text-sm">{g.name}</TableCell>
                    <TableCell className="py-1.5 text-muted-foreground text-xs">{g.location_city || "—"}</TableCell>
                    <TableCell className="py-1.5 text-muted-foreground text-xs max-w-[200px] truncate">{g.description || "—"}</TableCell>
                    <TableCell className="py-1.5 text-muted-foreground text-xs">
                      {g.created_at ? new Date(g.created_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="py-1.5 flex gap-1">
                      <Button size="sm" variant="default" className="h-7 text-xs gap-1" onClick={() => handleVerify(g.id)}>
                        <CheckCircle className="w-3 h-3" /> Verify
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-destructive" onClick={() => handleDelete(g.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* All Gyms */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="w-5 h-5 text-primary" /> All Gyms
          </CardTitle>
        </CardHeader>
        <CardContent>
          {verifiedGyms.length === 0 ? (
            <p className="text-muted-foreground text-center py-6 text-sm">No gyms registered yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">City</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Current Admin</TableHead>
                  <TableHead className="text-xs w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {verifiedGyms.map((g) => (
                  <TableRow key={g.id} className="h-10">
                    <TableCell className="py-1.5 font-medium text-foreground text-sm">{g.name}</TableCell>
                    <TableCell className="py-1.5 text-muted-foreground text-xs">{g.location_city || "—"}</TableCell>
                    <TableCell className="py-1.5">
                      <Badge variant={g.is_verified ? "default" : "outline"} className="text-[10px]">
                        {g.is_verified ? "Verified" : "Pending"}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="py-1.5 text-muted-foreground text-xs">
                       {g.admin_id ? (adminEmails[g.admin_id] || "Loading...") : "No Admin"}
                    </TableCell>
                    <TableCell className="py-1.5 flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { setAssignGym(g); setFoundUser(null);  fetchGymMembers(g.id); }}>
                        <UserPlus className="w-3 h-3" /> Assign
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-destructive" onClick={() => handleDelete(g.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Assign Admin Dialog */}
      <Dialog open={!!assignGym} onOpenChange={(open) => !open && setAssignGym(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Assign Admin — {assignGym?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
  <p className="text-xs text-muted-foreground">Select a member to promote:</p>
  <div className="max-h-[250px] overflow-y-auto space-y-2 border rounded-md p-2">
    {loadingMembers ? (
      <p className="text-center py-4 text-sm">Loading members...</p>
    ) : members.length === 0 ? (
      <p className="text-center py-4 text-sm text-destructive">No members found in this gym.</p>
    ) : (
      members.map((member) => (
        <div 
          key={member.user_id}
          onClick={() => setFoundUser(member)}
          className={`flex items-center justify-between p-2 rounded-md cursor-pointer border transition-colors ${
            foundUser?.user_id === member.user_id 
            ? "bg-primary/10 border-primary" 
            : "hover:bg-accent border-transparent"
          }`}
        >
          <div className="text-left">
            <p className="text-sm font-medium">{member.name || "No Name"}</p>
            <p className="text-xs text-muted-foreground">{member.email}</p>
          </div>
          {foundUser?.user_id === member.user_id && <CheckCircle className="w-4 h-4 text-primary" />}
        </div>
      ))
    )}
  </div>
</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignGym(null)}>Cancel</Button>
            <Button disabled={!foundUser} onClick={assignAdmin}>Assign as Admin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GymManagement;
