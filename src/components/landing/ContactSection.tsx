import { ChevronRight, Sparkles, Mail, MapPin, Phone } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { useRef } from "react";

export const ContactSection = () => {
    const contacts = [
      {
        icon: Mail,
        label: "Email",
        value: "info@gymini.app",
        color: "bg-sky-light text-primary",
        href: "mailto:info@gymini.app",
      },
      {
        icon: MapPin,
        label: "Location",
        value: "Beirut, Lebanon",
        color: "bg-coral-light text-coral",
        href: "#",
      },
      {
        icon: Phone,
        label: "Phone",
        value: "+961 3 123 456",
        color: "bg-mint-light text-secondary",
        href: "tel:+96112345678",
      },
    ];
   
    return (
        <section id="contact" className="scroll-mt-24 py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Get in Touch
            </h2>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Questions? We'd love to hear from you. Reach out through any of these channels.
            </p>
          </motion.div>
   
          {/* Contact cards */}
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
            {contacts.map((contact, i) => (
              <motion.a
                key={contact.label}
                href={contact.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group bg-card/60 backdrop-blur-md rounded-2xl border border-border/20 p-6 shadow-card hover:shadow-card-hover transition-all hover:border-primary/30"
              >
                <div className={`w-12 h-12 rounded-xl ${contact.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <contact.icon className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  {contact.label}
                </p>
                <p className="text-lg font-display font-bold text-foreground group-hover:text-primary transition-colors">
                  {contact.value}
                </p>
              </motion.a>
            ))}
          </div>
   
          {/* Quick message info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto bg-card/60 backdrop-blur-md rounded-2xl border border-border/20 p-8 text-center"
          >
            <p className="text-muted-foreground mb-4">
              <strong>Note:</strong> If you're facing technical issues, reply to any email from GYMini and our support team will respond within 24 hours.
            </p>
            <p className="text-sm text-muted-foreground">
              We're here Monday-Friday, 9 AM - 6 PM Beirut Time (GMT+2)
            </p>
          </motion.div>
        </div>
      </section>
    );
  };