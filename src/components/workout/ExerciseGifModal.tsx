import { Dumbbell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ExerciseVisual } from "@/lib/exerciseMatch";

interface ExerciseGifModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visual: ExerciseVisual | null;
  loading: boolean;
}

const ExerciseGifModal = ({ open, onOpenChange, visual, loading }: ExerciseGifModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="font-display text-center">
            {visual?.name || "Exercise Guide"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh]">
          <div className="flex flex-col items-center gap-4 pr-3">
            {loading ? (
              <div className="w-full aspect-square max-w-xs rounded-xl bg-muted flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <Dumbbell className="w-10 h-10 text-muted-foreground" />
                </motion.div>
              </div>
            ) : visual?.gifUrl && !visual.fallback ? (
              <img
                src={visual.gifUrl}
                alt={`${visual.name} demonstration`}
                className="w-full max-w-xs rounded-xl border border-border shadow-card"
              />
            ) : (
              <div className="w-full aspect-square max-w-xs rounded-xl bg-muted flex flex-col items-center justify-center gap-3 border border-border">
                <div className="w-20 h-20 rounded-full gradient-hero flex items-center justify-center shadow-hero">
                  <Dumbbell className="w-10 h-10 text-primary-foreground" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  Visual guide unavailable
                </p>
                <p className="text-xs text-muted-foreground/70 px-6 text-center">
                  Follow the set & rep instructions above
                </p>
              </div>
            )}

            {/* Tags */}
            {visual && !visual.fallback && (
              <div className="flex flex-wrap gap-2 justify-center">
                {visual.bodyPart && (
                  <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                    {visual.bodyPart}
                  </span>
                )}
                {visual.target && (
                  <span className="text-xs bg-accent/10 text-accent-foreground px-3 py-1 rounded-full font-medium">
                    {visual.target}
                  </span>
                )}
                {visual.equipment && (
                  <span className="text-xs bg-secondary/10 text-secondary-foreground px-3 py-1 rounded-full font-medium">
                    {visual.equipment}
                  </span>
                )}
              </div>
            )}

            {/* Instructions */}
            {visual && visual.instructions.length > 0 && (
              <div className="w-full bg-muted/50 rounded-xl p-4 border border-border">
                <h4 className="text-sm font-semibold text-foreground mb-3">How to perform</h4>
                <ol className="space-y-2">
                  {visual.instructions.map((step, i) => (
                    <li key={i} className="flex gap-2.5 text-xs text-muted-foreground leading-relaxed">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseGifModal;
