import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LogMetricsDialogProps {
  userId: string;
  onLogged: () => void;
  latestWeight?: number | null;
  latestBodyFat?: number | null;
  latestWaist?: number | null;
}

const LogMetricsDialog = ({ userId, onLogged, latestWeight, latestBodyFat, latestWaist }: LogMetricsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [muscleMass, setMuscleMass] = useState("");
  const [waist, setWaist] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setWeight(latestWeight ? String(latestWeight) : "");
    setBodyFat(latestBodyFat ? String(latestBodyFat) : "");
    setWaist(latestWaist ? String(latestWaist) : "");
    setNotes("");
    // Fetch latest height & muscle mass from body_measurements or profile
    const fetchLatest = async () => {
      const { data: profile } = await supabase.from("profiles").select("height").eq("user_id", userId).single();
      setHeight(profile?.height ? String(profile.height) : "");
      const { data: latest } = await supabase.from("body_measurements").select("muscle_mass").eq("user_id", userId).order("measured_at", { ascending: false }).limit(1).single();
      setMuscleMass(latest?.muscle_mass ? String(latest.muscle_mass) : "");
    };
    fetchLatest();
  }, [open, latestWeight, latestBodyFat, latestWaist, userId]);

  const handleSave = async () => {
    setSaving(true);
    const weightVal = weight ? parseFloat(weight) : null;
    const heightVal = height ? parseFloat(height) : null;

    const { error } = await supabase.from("body_measurements").upsert(
      {
        user_id: userId,
        measured_at: new Date().toISOString().split("T")[0],
        weight: weightVal,
        height: heightVal,
        body_fat_percentage: bodyFat ? parseFloat(bodyFat) : null,
        muscle_mass: muscleMass ? parseFloat(muscleMass) : null,
        waist_cm: waist ? parseFloat(waist) : null,
        notes: notes.trim() || null,
      },
      { onConflict: "user_id,measured_at" }
    );

    if (error) {
      console.error("Supabase body_measurements upsert error:", error.message);
      setSaving(false);
      toast.error(`Failed to save metrics: ${error.message}`);
      return;
    }

    // Sync weight & height to profiles for instant Vital Stats / BMI updates
    const profileUpdates: Record<string, unknown> = {};
    if (weightVal !== null) profileUpdates.weight = weightVal;
    if (heightVal !== null) profileUpdates.height = heightVal;
    if (bodyFat) profileUpdates.body_fat_percentage = parseFloat(bodyFat);
    if (Object.keys(profileUpdates).length) {
      await supabase.from("profiles").update(profileUpdates as any).eq("user_id", userId);
    }

    setSaving(false);
    toast.success("Metrics logged!");
    setOpen(false);
    onLogged();
  };

  const blockInvalidKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
      e.preventDefault();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="w-4 h-4" /> Log Metrics
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Log Body Metrics</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Weight (kg)</Label>
              <Input type="number" value={weight} onKeyDown={blockInvalidKeys} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 75" />
            </div>
            <div className="grid gap-1.5">
              <Label>Height (cm)</Label>
              <Input type="number" value={height} onKeyDown={blockInvalidKeys} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 175" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Body Fat %</Label>
              <Input type="number" value={bodyFat} onKeyDown={blockInvalidKeys} onChange={(e) => setBodyFat(e.target.value)} placeholder="e.g. 18" />
            </div>
            <div className="grid gap-1.5">
              <Label>Muscle Mass (kg)</Label>
              <Input type="number" value={muscleMass} onKeyDown={blockInvalidKeys} onChange={(e) => setMuscleMass(e.target.value)} placeholder="e.g. 35" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Waist (cm)</Label>
            <Input type="number" value={waist} onKeyDown={blockInvalidKeys} onChange={(e) => setWaist(e.target.value)} placeholder="e.g. 82" />
          </div>
          <div className="grid gap-1.5">
            <Label>Notes (optional)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. morning weigh-in, post-workout" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="gradient-hero text-primary-foreground">
            {saving ? "Saving..." : "Save Metrics"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LogMetricsDialog;
