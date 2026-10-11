import { useState } from "react";
import { LayoutDashboard, Users, Building2, Settings, LogOut, ScrollText, Shield, MessageSquare } from "lucide-react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "@/components/NavLink";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const adminNav = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Manage Users", url: "/admin/users", icon: Users },
  { title: "Manage Gyms", url: "/admin/gyms", icon: Building2 },
  { title: "Reviews", url: "/admin/reviews", icon: MessageSquare },
  { title: "System Logs", url: "/admin/logs", icon: ScrollText },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = async () => {
    setShowLogout(false);
    await logout();
    navigate("/");
  };

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-border">
        <SidebarContent className="flex flex-col h-full">
          <div className="p-4 flex items-center gap-2 border-b border-border">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="text-lg font-display font-bold text-foreground">Admin Panel</span>
            )}
          </div>

          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/admin"}
                        className="hover:bg-muted/50"
                        activeClassName="bg-muted text-primary font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <div className="mt-auto p-4 border-t border-border space-y-3">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0">
                  {user?.name?.[0]?.toUpperCase() || "A"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                  <Badge variant="outline" className="text-[10px] border-primary text-primary">Admin</Badge>
                </div>
              </div>
            )}
            <button
              onClick={() => setShowLogout(true)}
              className="flex items-center gap-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg px-2 py-1.5 w-full transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {!collapsed && "Log Out"}
            </button>
          </div>
        </SidebarContent>
      </Sidebar>

      <AlertDialog open={showLogout} onOpenChange={setShowLogout}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out of GYMini?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? You'll need to sign in again to access your workouts and progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Log Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const AdminLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border px-4 bg-card/80 backdrop-blur-sm sticky top-0 z-40">
            <SidebarTrigger className="mr-3" />
            <span className="text-sm text-muted-foreground font-medium">System Administration</span>
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
