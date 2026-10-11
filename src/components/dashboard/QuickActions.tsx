import { Zap, Calendar, TrendingUp, Trophy, ChevronRight, Building2, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadDMs } from "@/hooks/useUnreadDMs";

const secondaryActions = [
  { title: "Import Coach Plan", description: "Paste & AI structures it", icon: Calendar, to: "/import-plan", gradient: "bg-mint" },
  { title: "My Saved Plans", description: "Resume past workouts", icon: TrendingUp, to: "/saved-plans", gradient: "gradient-warm" },
  { title: "Leaderboard", description: "See who's on top", icon: Trophy, to: "/leaderboard", gradient: "bg-mint" },
];

export const QuickActions = () => {
  const { isGymAdmin } = useAuth();
  const unreadDMs = useUnreadDMs();

  return (
    <div className="space-y-4">
      {/* Primary CTA */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Link to="/generator">
          <Button
            size="lg"
            className="w-full h-16 text-lg font-display font-bold gradient-hero text-primary-foreground shadow-hero hover:opacity-90 transition-opacity rounded-2xl gap-3 shimmer-btn relative overflow-hidden"
          >
            <Zap className="w-6 h-6" />
            Generate AI Workout
            <ChevronRight className="w-5 h-5" />
          </Button>
        </Link>
      </motion.div>

      {/* Gym Admin CTA */}
      {isGymAdmin && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Link to="/gym-admin">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-12 font-display font-bold rounded-2xl gap-2 border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
            >
              <Building2 className="w-5 h-5" />
              Gym Management Center
            </Button>
          </Link>
        </motion.div>
      )}

      {/* 2-column grid */}
      <div className="grid grid-cols-2 gap-3">
        {secondaryActions.map((action, i) => (
          <motion.div key={action.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.08 }}>
            <Link
              to={action.to}
              className="block bg-card rounded-xl p-4 border border-border shadow-card hover:shadow-card-hover transition-all hover:-translate-y-0.5 group"
            >
              <div className={`w-10 h-10 rounded-lg ${action.gradient} flex items-center justify-center mb-2`}>
                <action.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="text-sm font-display font-bold text-foreground mb-0.5">{action.title}</h3>
              <p className="text-xs text-muted-foreground leading-tight">{action.description}</p>
            </Link>
          </motion.div>
        ))}

        {/* Community card with unread badge */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + 3 * 0.08 }}>
          <Link
            to="/community"
            className="block bg-card rounded-xl p-4 border border-border shadow-card hover:shadow-card-hover transition-all hover:-translate-y-0.5 group relative"
          >
            <div className="w-10 h-10 rounded-lg gradient-hero flex items-center justify-center mb-2">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <h3 className="text-sm font-display font-bold text-foreground mb-0.5">Community</h3>
            <p className="text-xs text-muted-foreground leading-tight">Chat & connect</p>
            {unreadDMs > 0 && (
              <span className="absolute top-3 right-3 w-6 h-6 rounded-full gradient-hero text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadDMs > 9 ? "9+" : unreadDMs}
              </span>
            )}
          </Link>
        </motion.div>
      </div>
    </div>
  );
};
