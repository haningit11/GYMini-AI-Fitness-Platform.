import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface SiteReview {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: { name: string } | null;
}

const fallbackReviews = [
  { name: "Karim B.", text: "GYMini helped me stay consistent for 30 days straight! The AI plans are perfectly tailored to my goals.", avatar: "K", rating: 5 },
  { name: "Nour S.", text: "I love the leaderboard — competing with my gym friends keeps me motivated every single week.", avatar: "N", rating: 5 },
  { name: "Lina M.", text: "The progress tracking and streak system are addictive. Best fitness app I've ever used!", avatar: "L", rating: 5 },
  { name: "Omar H.", text: "As a personal trainer, I recommend GYMini to all my clients. The AI workout generator is incredibly accurate.", avatar: "O", rating: 5 },
];

const StarRating = ({ value, onChange }: { value: number; onChange?: (v: number) => void }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < value ? "fill-gold text-gold" : "text-muted-foreground/30"} ${onChange ? "cursor-pointer" : ""}`}
        onClick={() => onChange?.(i + 1)}
      />
    ))}
  </div>
);

const Testimonials = () => {
  const { isAuthenticated, authUser } = useAuth();
  const [reviews, setReviews] = useState<SiteReview[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const fetchReviews = async () => {
    try {
      // Single join query — 50% fewer network requests
      const { data, error } = await supabase
        .from("site_reviews")
        .select("*, profiles(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;

     if (data && data.length > 0) {
        // 1. Create a copy and shuffle it so it's different on every refresh
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        setReviews(shuffled);

        // 2. Use the original 'data' to calculate the average rating accurately
        const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
        setAvgRating(Math.round(avg * 10) / 10);

        if (authUser?.id) {
          setHasReviewed(data.some((r) => r.user_id === authUser.id));
        }
      } else {
        setReviews([]);
        setAvgRating(0);
      }
      setFetchError(false);
    } catch {
      setFetchError(true);
      setReviews([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, [authUser?.id]);

  const handleSubmit = async () => {
    if (!authUser?.id || !newComment.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("site_reviews").insert({
      user_id: authUser.id,
      rating: newRating,
      comment: newComment.trim(),
    });
    if (error) {
      toast.error("Failed to submit review");
    } else {
      toast.success("Review submitted!");
      setNewComment("");
      setNewRating(5);
      await fetchReviews();
    }
    setSubmitting(false);
  };

  const getName = (r: SiteReview) => (r.profiles as any)?.name || "User";

  // Fall back to static testimonials on error or empty
  const useFallback = fetchError || reviews.length === 0;
  const displayReviews = useFallback ? null : reviews.slice(0, 4);

  return (
      <section id="testimonials" className="scroll-mt-24 py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Wall of Love
          </h2>
          {!useFallback ? (
            <div className="flex items-center justify-center gap-2">
              <StarRating value={Math.round(avgRating)} />
              <span className="text-muted-foreground text-lg">{avgRating} / 5 ({reviews.length} reviews)</span>
            </div>
          ) : (
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Real results from real people across Lebanon.
            </p>
          )}
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {displayReviews
            ? displayReviews.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card/60 backdrop-blur-md rounded-2xl border border-border/20 p-6 shadow-card"
                >
                  <StarRating value={r.rating} />
                  <p className="text-sm text-foreground leading-relaxed mb-4 mt-3 italic">"{r.comment}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full gradient-hero flex items-center justify-center text-primary-foreground text-sm font-bold">
                      {getName(r)[0].toUpperCase()}
                    </div>
                    <p className="text-sm font-display font-bold text-foreground">{getName(r)}</p>
                  </div>
                </motion.div>
              ))
            : fallbackReviews.map((r, i) => (
                <motion.div
                  key={r.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card/60 backdrop-blur-md rounded-2xl border border-border/20 p-6 shadow-card"
                >
                  <StarRating value={r.rating} />
                  <p className="text-sm text-foreground leading-relaxed mb-4 mt-3 italic">"{r.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full gradient-hero flex items-center justify-center text-primary-foreground text-sm font-bold">
                      {r.avatar}
                    </div>
                    <p className="text-sm font-display font-bold text-foreground">{r.name}</p>
                  </div>
                </motion.div>
              ))}
        </div>

        {isAuthenticated && !hasReviewed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 max-w-lg mx-auto bg-card/60 backdrop-blur-md rounded-2xl border border-border/20 p-6"
          >
            <h3 className="text-lg font-display font-bold text-foreground mb-3">Rate GYMini</h3>
            <StarRating value={newRating} onChange={setNewRating} />
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Tell us about your experience..."
              className="mt-3"
              maxLength={500}
            />
            <Button
              onClick={handleSubmit}
              disabled={submitting || !newComment.trim()}
              className="mt-3 gradient-hero text-primary-foreground"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;
