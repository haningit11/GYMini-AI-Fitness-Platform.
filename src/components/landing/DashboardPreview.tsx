import { motion } from "framer-motion";
import { Flame, TrendingUp, Dumbbell, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const DashboardPreview = () => (
  <section className="py-24">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
          Your Dashboard Awaits
        </h2>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          A powerful command center for your fitness journey. Here's a sneak peek.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative max-w-3xl mx-auto"
      >
        {/* Glassmorphism card */}
        <div className="bg-card/70 backdrop-blur-lg rounded-3xl border border-border/30 p-6 md:p-8 shadow-hero">
          {/* Browser dots */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <div className="w-3 h-3 rounded-full bg-gold" />
            <div className="w-3 h-3 rounded-full bg-secondary" />
            <span className="ml-2 text-xs text-muted-foreground font-mono">gymini / dashboard</span>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { icon: Flame, label: "Streak", value: "12 Days", bg: "bg-coral-light" },
              { icon: TrendingUp, label: "Weekly XP", value: "+340", bg: "bg-sky-light" },
              { icon: Dumbbell, label: "Workouts", value: "48", bg: "bg-mint-light" },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
                <s.icon className="w-5 h-5 mx-auto mb-1 text-foreground/70" />
                <p className="text-lg font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Workout list */}
          <div className="space-y-2 mb-6">
            {["Push Day — Chest & Triceps", "Pull Day — Back & Biceps", "Leg Day — Squats & Lunges"].map((w, i) => (
              <div key={w} className="flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-2.5">
                <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center text-primary-foreground text-xs font-bold">
                  D{i + 1}
                </div>
                <span className="text-sm font-medium text-foreground">{w}</span>
              </div>
            ))}
          </div>

          {/* Chart placeholder */}
          <div className="bg-muted/30 rounded-2xl p-4 flex items-center justify-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground font-medium">Weekly progress chart</span>
          </div>
        </div>

        {/* Blur overlay to tease */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-background via-background/60 to-transparent flex flex-col items-center justify-end pb-10">
          <p className="text-foreground font-display font-bold text-lg mb-3">
            Sign up to unlock your full dashboard
          </p>
          <Link
            to="/sign-up"
            className="shimmer-btn inline-flex items-center gap-2 px-6 py-3 rounded-2xl gradient-hero text-primary-foreground font-bold shadow-hero transition-all hover:scale-105"
          >
            Get Started Free
          </Link>
        </div>
      </motion.div>
    </div>
  </section>
);

export default DashboardPreview;
