import { ChevronRight, Sparkles } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { useRef } from "react";

const HeroSection = () => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const blobX1 = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const blobY1 = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const blobX2 = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const blobY2 = useTransform(scrollYProgress, [0, 1], [0, -60]);
 
  return (
    <section ref={ref} className="relative pt-32 pb-28 overflow-hidden">
      <motion.div
        style={{ x: blobX1, y: blobY1 }}
        className="absolute top-0 -left-40 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]"
      />
      <motion.div
        style={{ x: blobX2, y: blobY2 }}
        className="absolute bottom-0 -right-40 w-[400px] h-[400px] rounded-full bg-secondary/20 blur-[120px]"
      />
 
      <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          {/* NEW: Badge with animation */}
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card/60 backdrop-blur-md border border-border text-primary text-sm font-semibold mb-6 hover:border-primary/50 transition-colors"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity }}>
              <Sparkles className="w-4 h-4" />
            </motion.div>
            AI-Powered Fitness Platform
          </motion.span>
 
          {/* IMPROVED: Better heading with stagger */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-extrabold leading-tight text-foreground mb-6">
              Your Fitness,{" "}
              <motion.span
                className="text-gradient-hero block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                AI-Powered.
              </motion.span>
            </h1>
          </motion.div>
 
          {/* IMPROVED: Better description with confidence */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Stop guessing workouts. Get AI-powered plans that adapt to <strong>you</strong>. Track every rep. Compete with your gym. Level up daily.
          </motion.p>
 
          {/* IMPROVED: Better CTA with hover effect */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link
              to="/sign-up"
              className="shimmer-btn inline-flex items-center gap-2 px-8 py-4 rounded-3xl gradient-hero text-primary-foreground font-bold text-lg shadow-hero transition-all hover:scale-105 active:scale-95"
            >
              Start Free Now <ChevronRight className="w-5 h-5" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-3xl border-2 border-primary text-primary font-bold text-lg hover:bg-primary/5 transition-all"
            >
              See How It Works
            </a>
          </motion.div>
 
          {/* IMPROVED: Social proof with better visuals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-muted-foreground text-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["K", "N", "L", "O"].map((l, i) => (
                  <motion.div
                    key={l}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="w-9 h-9 rounded-full gradient-hero flex items-center justify-center text-primary-foreground text-xs font-bold border-2 border-background"
                  >
                    {l}
                  </motion.div>
                ))}
              </div>
              <div>
                <p className="font-bold text-foreground">200+ Athletes</p>
                <p className="text-xs">Training smarter</p>
              </div>
            </div>
 
            <div className="hidden sm:block w-px h-12 bg-border" />
 
            <div className="text-center sm:text-left">
              <p className="font-bold text-foreground">Made for Everyone</p>
              <p className="text-xs">Built by fitness enthusiasts</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
 
export default HeroSection;