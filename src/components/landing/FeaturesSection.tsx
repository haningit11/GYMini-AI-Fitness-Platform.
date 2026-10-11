import { Brain, Trophy, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Brain,
    title: "AI Workout Architect",
    description:
      "Custom plans based on your specific goals — weight loss, muscle gain, or hybrid. Powered by advanced AI that adapts to your progress.",
    color: "bg-sky-light text-primary",
  },
  {
    icon: Trophy,
    title: "The Elite Leaderboard",
    description:
      "Compete with athletes across Lebanon, earn XP, and climb the ranks from Rookie to Gold. Members-only access.",
    color: "bg-gold-light text-gold",
  },
  {
    icon: MessageCircle,
    title: "Gym Community & Chat",
    description:
      "Connect with trainers and fellow athletes at your local verified gym. Real-time chat, direct messages, and community feed.",
    color: "bg-mint-light text-secondary",
  },
];

const FeaturesSection = () => (
  <section id="features" className="scroll-mt-24 py-24">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
          Unlock Your Full Potential
        </h2>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto">
          Everything you need to train smarter, track progress, and stay motivated — all in one place.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">
        {features.map((feat, i) => (
          <motion.div
            key={feat.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="bg-card/60 backdrop-blur-md rounded-3xl p-8 shadow-card hover:shadow-card-hover transition-shadow border border-border/20"
          >
            <div
              className={`w-14 h-14 rounded-2xl ${feat.color} flex items-center justify-center mb-5`}
            >
              <feat.icon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-display font-bold text-foreground mb-2">
              {feat.title}
            </h3>
            <p className="text-muted-foreground leading-relaxed">{feat.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
