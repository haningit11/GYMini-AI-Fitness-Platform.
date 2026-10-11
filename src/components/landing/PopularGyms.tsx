import { MapPin, Users } from "lucide-react";
import { motion } from "framer-motion";

const gyms = [
  { name: "Flex Fitness", area: "Beirut", members: 124, color: "border-t-primary" },
  { name: "Matrix", area: "Zahle", members: 98, color: "border-t-secondary" },
  { name: "EnergyMax", area: "Hamra", members: 87, color: "border-t-coral" },
  { name: "PrimeGYM", area: "Beirut", members: 156, color: "border-t-gold" },
];

const PopularGyms = () => (
  <section id="gyms" className="scroll-mt-24 py-20">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
          Popular in Beirut 🇱🇧
        </h2>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Top gyms across Lebanon already crushing it with GYMini.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {gyms.map((gym, i) => (
          <motion.div
            key={gym.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`bg-card/60 backdrop-blur-md rounded-2xl border border-border/20 border-t-4 ${gym.color} p-6 shadow-card hover:shadow-card-hover transition-shadow`}
          >
            <h3 className="font-display font-bold text-foreground text-lg mb-2">{gym.name}</h3>
            <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
              <MapPin className="w-3.5 h-3.5" />
              <span>{gym.area}</span>
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold text-primary">
              <Users className="w-3.5 h-3.5" />
              <span>{gym.members} members</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default PopularGyms;
