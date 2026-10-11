import { useState, useEffect, useMemo } from "react";
import { Dumbbell, Shield, Users, Building2, Edit, Trash2, UserMinus, ChevronLeft, MessageSquare, BarChart3, Save } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";

interface GymData {
  id: string;
  name: string;
  description: string | null;
  location_city: string | null;
  is_verified: boolean;
  access_password: string;
}

interface Member {
  user_id: string;
  name: string;
  email: string;
  xp: number;
  rank: string;
  level: string | null;
}

interface ChatMsg {
  id: string;
  user_id: string;
  user_name: string;
  room: string;
  content: string;
  created_at: string;
}

const GymAdminDashboard = () => {
  const { authUser } = useAuth();
  const navigate = useNavigate();

  const [gym, setGym] = useState<GymData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);

  // Editable gym fields
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authUser) loadGymData();
  }, [authUser]);

  const loadGymData = async () => {
    setLoading(true);
    // Find the gym this user admins
    const { data: gymRow } = await supabase
      .from("gyms")
      .select("id, name, description, location_city, is_verified, access_password")
      .eq("admin_id", authUser!.id)
      .limit(1)
      .single();

    if (!gymRow) {
      setLoading(false);
      return;
    }

    if (!gymRow.is_verified) {
      setGym(gymRow);
      setLoading(false);
      return;
    }

    setGym(gymRow);
    setEditName(gymRow.name);
    setEditDesc(gymRow.description ?? "");
    setEditCity(gymRow.location_city ?? "");
    setEditPassword(gymRow.access_password || "");

    // Fetch members
    const { data: memberRows } = await supabase
      .from("profiles")
      .select("user_id, name, email, xp, rank, level")
      .eq("gym_id", gymRow.id);
    setMembers((memberRows as Member[]) ?? []);

    // Fetch chat messages for this gym's room
    const { data: chatRows } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("room", gymRow.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setMessages((chatRows as ChatMsg[]) ?? []);

    setLoading(false);
  };

  const saveGymProfile = async () => {
    if (!gym) return;
    setSaving(true);
    const { error } = await supabase
      .from("gyms")
      .update({ 
        name: editName.trim(), 
        description: editDesc.trim() || null, 
        location_city: editCity.trim() || null,
        access_password: editPassword.trim()
      })
      .eq("id", gym.id);
    if (error) toast.error("Failed to update gym profile");
    else {
      toast.success("Gym profile updated!");
      setGym({ 
        ...gym, 
        name: editName.trim(), 
        description: editDesc.trim() || null, 
        location_city: editCity.trim() || null,
        access_password: editPassword.trim()
      });
    }
    setSaving(false);
  };

  const kickMember = async (userId: string, memberName: string) => {
    const { error } = await supabase.from("profiles").update({ gym_id: null }).eq("user_id", userId);
    if (error) {
      toast.error("Failed to remove member");
      return;
    }
    setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    toast.success(`${memberName || "Member"} removed from gym`);
  };

  const deleteMessage = async (msgId: string) => {
    const { error } = await supabase.from("chat_messages").delete().eq("id", msgId);
    if (error) {
      toast.error("Failed to delete message");
      return;
    }
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    toast.success("Message deleted");
  };

  const totalXp = useMemo(() => members.reduce((s, m) => s + (m.xp ?? 0), 0), [members]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!gym) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Building2 className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">No gym assigned to your account.</p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  if (!gym.is_verified) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-2">
          <Building2 className="w-8 h-8 text-orange-500" />
        </div>
        <h2 className="text-2xl font-display font-bold text-foreground">Verification Pending</h2>
        <p className="text-muted-foreground max-w-md">
          Your gym <strong>{gym.name}</strong> is currently pending verification. 
          Access to the dashboard and community features will be granted once an admin approves it.
        </p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto flex items-center justify-between py-3 px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            {/* <span className="text-xl font-display font-bold text-foreground">GYMini</span> */}
          </Link>
          <Badge className="gradient-warm text-primary-foreground border-0 gap-1">
            <Shield className="w-3 h-3" /> Gym Admin
          </Badge>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-6 max-w-5xl space-y-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display font-bold text-foreground mb-1">{gym.name}</h1>
            {gym.is_verified ? (
              <Badge className="gradient-hero text-primary-foreground border-0 text-[10px]">Verified</Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] border-orange-500 text-orange-500">Pending Verification</Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">Manage your gym, members, and chat.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
              <p className="text-xl font-display font-bold text-foreground">{members.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Members</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg gradient-warm flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
              <p className="text-xl font-display font-bold text-foreground">{totalXp.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Total XP</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
              <p className="text-xl font-display font-bold text-foreground">{messages.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Chat Messages</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile" className="gap-1.5"><Edit className="w-3.5 h-3.5" /> Gym Profile</TabsTrigger>
            <TabsTrigger value="members" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Members</TabsTrigger>
            <TabsTrigger value="chat" className="gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Chat Moderation</TabsTrigger>
          </TabsList>

          {/* Gym Profile Editor */}
          <TabsContent value="profile">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Edit className="w-4 h-4 text-primary" /> Edit Gym Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Gym Name</label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">City</label>
                  <Input value={editCity} onChange={(e) => setEditCity(e.target.value)} placeholder="e.g. Beirut" className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Access Password</label>
                  <Input value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Password for chat access" className="h-9 text-sm" />
                  <p className="text-[10px] text-muted-foreground mt-1">Members will need this password to join the gym chat.</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                  <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Tell members about your gym…" className="text-sm min-h-[80px]" />
                </div>
                <Button onClick={saveGymProfile} disabled={saving || !editName.trim()} className="gap-1.5">
                  <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members */}
          <TabsContent value="members">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> Members ({members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8 text-sm">No members in this gym yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs">Email</TableHead>
                        <TableHead className="text-xs">Level</TableHead>
                        <TableHead className="text-xs">XP</TableHead>
                        <TableHead className="text-xs">Rank</TableHead>
                        <TableHead className="text-xs w-20">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((m) => (
                        <TableRow key={m.user_id} className="h-10">
                          <TableCell className="py-1.5 font-medium text-foreground text-sm">{m.name || "—"}</TableCell>
                          <TableCell className="py-1.5 text-muted-foreground text-xs">{m.email}</TableCell>
                          <TableCell className="py-1.5">
                            {m.level ? <Badge variant="secondary" className="text-[10px]">{m.level}</Badge> : <span className="text-muted-foreground text-xs">—</span>}
                          </TableCell>
                          <TableCell className="py-1.5 font-mono text-foreground text-xs">{m.xp}</TableCell>
                          <TableCell className="py-1.5">
                            <Badge variant="outline" className="text-[10px]">{m.rank}</Badge>
                          </TableCell>
                          <TableCell className="py-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                              onClick={() => kickMember(m.user_id, m.name)}
                            >
                              <UserMinus className="w-3 h-3" /> Kick
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Moderation */}
          <TabsContent value="chat">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" /> Chat Moderation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {messages.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8 text-sm">No chat messages yet.</p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    <AnimatePresence initial={false}>
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-medium text-foreground">{msg.user_name}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(msg.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{msg.content}</p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                            onClick={() => deleteMessage(msg.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default GymAdminDashboard;
