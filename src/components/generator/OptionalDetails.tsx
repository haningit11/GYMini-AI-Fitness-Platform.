import { Settings2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EQUIPMENT_OPTIONS = [
  { value: "full_gym", label: "Full Gym" },
  { value: "bodyweight_dumbbells", label: "Bodyweight / Dumbbells" },
  { value: "resistance_bands", label: "Resistance Bands" },
  { value: "minimal", label: "Minimal (No Equipment)" },
];

interface OptionalDetailsProps {
  equipment: string;
  onEquipmentChange: (v: string) => void;
  extraNotes: string;
  onExtraNotesChange: (v: string) => void;
  trainingDays: number;
  onTrainingDaysChange: (v: number) => void;
}

const DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

const OptionalDetails = ({ equipment, onEquipmentChange, extraNotes, onExtraNotesChange, trainingDays, onTrainingDaysChange }: OptionalDetailsProps) => (
  <Accordion type="single" collapsible className="mb-6">
    <AccordionItem value="details" className="border-none">
      <AccordionTrigger className="bg-muted rounded-xl px-4 py-3 hover:no-underline text-sm font-semibold text-foreground [&[data-state=open]]:rounded-b-none">
        <span className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-primary" />
          Optional Details
        </span>
      </AccordionTrigger>
      <AccordionContent className="bg-muted rounded-b-xl px-4 pb-4">
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Training Frequency</label>
            <div className="flex gap-1.5">
              {DAY_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => onTrainingDaysChange(d)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all border ${
                    trainingDays === d
                      ? "gradient-hero text-primary-foreground border-transparent shadow-hero"
                      : "bg-background text-foreground border-border hover:border-primary"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">days per week</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Available Equipment</label>
            <Select value={equipment} onValueChange={onEquipmentChange}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Extra details or injuries</label>
            <Textarea
              placeholder="e.g. 'My left knee hurts' or 'Focus on chest today'"
              value={extraNotes}
              onChange={(e) => onExtraNotesChange(e.target.value)}
              className="bg-background resize-none"
              rows={3}
            />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);

export default OptionalDetails;
