import { Target, Cpu, Users } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    num: "01",
    icon: Target,
    title: "Set Your Goal",
    desc: "Tell us your fitness level and what you want to achieve — lose weight, build muscle, or both.",
    color: "bg-coral-light text-coral",
  },
  {
    num: "02",
    icon: Cpu,
    title: "Get Your AI Plan",
    desc: "Our AI instantly generates a personalized multi-day workout plan tailored to your body and goals.",
    color: "bg-sky-light text-primary",
  },
  {
    num: "03",
    icon: Users,
    title: "Join the Community",
    desc: "Connect with your local gym, compete on leaderboards, track streaks, and level up together.",
    color: "bg-mint-light text-secondary",
  },
];

const HowItWorks = () => (
  <section id="how-it-works" className="scroll-mt-24 py-24 bg-muted/30">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
          How It Works
        </h2>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Three simple steps to transform your training.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {steps.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="text-center"
          >
            <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-4`}>
              <step.icon className="w-8 h-8" />
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Step {step.num}
            </span>
            <h3 className="text-lg font-display font-bold text-foreground mt-2 mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
