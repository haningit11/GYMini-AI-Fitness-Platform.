import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const FinalCTA = () => (
  <section className="py-24">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative rounded-3xl gradient-hero p-12 md:p-16 text-center overflow-hidden"
      >
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-primary-foreground/10 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full bg-primary-foreground/10 translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10">
          <h2 className="text-3xl md:text-5xl font-display font-extrabold text-primary-foreground mb-4">
            Ready to Transform?
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-lg mx-auto mb-8">
            Join hundreds of athletes already training smarter with GYMini. It's free to start.
          </p>
          <Link
            to="/sign-up"
            className="shimmer-btn inline-flex items-center gap-2 px-10 py-4 rounded-3xl bg-primary-foreground text-foreground font-bold text-lg shadow-hero transition-all hover:scale-105"
          >
            Start Your Transformation Free <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </motion.div>
    </div>
  </section>
);

export default FinalCTA;
