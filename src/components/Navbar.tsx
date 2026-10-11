import { useState } from "react";
import { Dumbbell, LogOut, ChevronRight, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const navLinkClass =
  "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = async () => {
    setShowLogout(false);
    await logout();
    navigate("/");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between py-3 px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">GYMini</span>
          </Link>

          {/* ===== UPDATED NAVIGATION MENU ===== */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className={navLinkClass}>
              Features
            </a>
            <a href="#how-it-works" className={navLinkClass}>
              How it Works
            </a>
            <a href="#gyms" className={navLinkClass}>
              Gyms
            </a>
            <a href="#testimonials" className={navLinkClass}>
              Reviews
            </a>
            <a href="#contact" className={navLinkClass}>
              Contact
            </a>
            {isAuthenticated && (
              <Link to="/generator" className={navLinkClass}>
                Generator
              </Link>
            )}
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1 px-4 sm:px-5 py-2.5 rounded-xl gradient-hero text-primary-foreground font-semibold text-sm shadow-hero hover:opacity-90 transition-opacity"
              >
                Go to Dashboard <ChevronRight className="w-4 h-4" />
              </Link>
              <Link to="/profile" className="hidden sm:flex items-center gap-2">
                <Avatar className="w-9 h-9 border-2 border-primary/30">
                  <AvatarImage src={user?.avatarUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden lg:block text-sm font-semibold text-foreground max-w-[120px] truncate">
                  {user?.name}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setShowLogout(true)}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/sign-in"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
              <Link
                to="/sign-up"
                className="inline-flex items-center gap-1 px-5 py-2.5 rounded-xl gradient-hero text-primary-foreground font-semibold text-sm shadow-hero hover:opacity-90 transition-opacity"
              >
                Get Started <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </nav>

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
};

export default Navbar;