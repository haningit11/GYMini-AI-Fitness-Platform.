import { useState, useEffect } from "react";
import { Star, Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 cursor-pointer transition-colors ${i < value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30 hover:text-yellow-400/50"}`}
        onClick={() => onChange(i + 1)}
      />
    ))}
  </div>
);

export const RateUsBadge = () => {
  const { authUser } = useAuth();
  const [hasReviewed, setHasReviewed] = useState(true);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authUser?.id) return;
    supabase
      .from("site_reviews")
      .select("id")
      .eq("user_id", authUser.id)
      .limit(1)
      .then(({ data }) => setHasReviewed((data?.length ?? 0) > 0));
  }, [authUser?.id]);

  if (hasReviewed) return null;

  const handleSubmit = async () => {
    if (!authUser?.id || !comment.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("site_reviews").insert({
      user_id: authUser.id,
      rating,
      comment: comment.trim(),
    });
    if (error) {
      toast({ title: "Error", description: "Failed to submit review", variant: "destructive" });
    } else {
      toast({ title: "Thank you!", description: "Your review has been submitted." });
      setHasReviewed(true);
    }
    setSubmitting(false);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1"
      >
        <Star className="w-3 h-3 fill-primary" />
        Rate Us
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            className="absolute left-0 top-full mt-2 w-64 bg-card rounded-xl border border-border p-3 shadow-lg z-50 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-display font-bold text-foreground">Rate GYMini</span>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <StarRating value={rating} onChange={setRating} />
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How's your experience?"
              className="text-xs min-h-0 h-14 resize-none"
              maxLength={500}
            />
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting || !comment.trim()}
              className="w-full h-7 text-xs gradient-hero text-primary-foreground"
            >
              <Send className="w-3 h-3 mr-1" />
              {submitting ? "Sending..." : "Submit"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
