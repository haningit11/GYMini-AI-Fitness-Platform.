import { useState } from "react";
import { Dumbbell, Zap, MessageCircle, BarChart3, Trophy, Activity, Shield, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadDMs } from "@/hooks/useUnreadDMs";
import { MobileNav } from "./MobileNav";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const navLinks = [
  { to: "/generator", label: "Generator", icon: Zap },
  { to: "/community", label: "Community", icon: MessageCircle },
  { to: "/progress", label: "Progress", icon: BarChart3 },
  { to: "/analytics", label: "Analytics", icon: Activity },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export const DashboardNavbar = () => {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const unreadDMs = useUnreadDMs();
  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = async () => {
    setShowLogout(false);
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container mx-auto max-w-6xl flex items-center justify-between h-14 px-4 md:px-6">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-foreground">GYMini</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <link.icon className="w-4 h-4" />
              {link.label}
              {link.label === "Community" && unreadDMs > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full gradient-hero text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {unreadDMs > 9 ? "9+" : unreadDMs}
                </span>
              )}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Shield className="w-4 h-4" />
              Admin
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex items-center gap-1.5 text-destructive hover:bg-destructive/10"
            onClick={() => setShowLogout(true)}
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>
          <MobileNav isAdmin={isAdmin} onLogout={handleLogout} />
        </div>
      </div>

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
    </header>
  );
};
