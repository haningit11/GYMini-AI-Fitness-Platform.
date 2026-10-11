import { useState } from "react";
import { Menu, Dumbbell, Shield, LogOut, Zap, BarChart3, Trophy, MessageCircle, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useUnreadDMs } from "@/hooks/useUnreadDMs";
import { useAuth } from "@/contexts/AuthContext";
import { AvatarUpload } from "@/components/AvatarUpload";
import { getRankProgress } from "@/lib/xp-logic";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MobileNavProps {
  isAdmin: boolean;
  onLogout: () => void;
}

const navLinks = [
  { to: "/generator", label: "Generator", icon: Zap },
  { to: "/community", label: "Community", icon: MessageCircle },
  { to: "/progress", label: "Progress", icon: BarChart3 },
  { to: "/analytics", label: "Analytics", icon: Activity },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export const MobileNav = ({ isAdmin, onLogout }: MobileNavProps) => {
  const unreadDMs = useUnreadDMs();
  const { user } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const rankInfo = getRankProgress(user?.xp || 0);

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <button className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors">
            <Menu className="w-5 h-5 text-foreground" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-primary-foreground" />
              </div>
              GYMini
            </SheetTitle>
          </SheetHeader>

          {/* User avatar + rank in mobile nav */}
          <div className="mt-4 mb-2 flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            <AvatarUpload avatarUrl={user?.avatarUrl} name={user?.name} size="sm" onUploaded={() => {}} />
            <div className="min-w-0">
              <p className="text-sm font-display font-bold text-foreground truncate">{user?.name || "Champion"}</p>
              <p className="text-[10px] text-muted-foreground">
                {rankInfo.current.name} · {(user?.xp || 0).toLocaleString()} XP
              </p>
            </div>
          </div>

          <nav className="mt-2 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
                {link.label === "Community" && unreadDMs > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full gradient-hero text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {unreadDMs > 9 ? "9+" : unreadDMs}
                  </span>
                )}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
            <button
              onClick={() => setShowLogout(true)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </nav>
        </SheetContent>
      </Sheet>

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
            <AlertDialogAction onClick={() => { setShowLogout(false); onLogout(); }}>Log Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
