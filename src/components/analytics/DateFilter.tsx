import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface DateFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const DateFilter = ({ value, onChange }: DateFilterProps) => (
  <ToggleGroup type="single" value={value} onValueChange={(v) => v && onChange(v)} className="bg-muted rounded-lg p-1">
    <ToggleGroupItem value="7" className="text-xs px-3 py-1.5 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
      Last 7 Days
    </ToggleGroupItem>
    <ToggleGroupItem value="30" className="text-xs px-3 py-1.5 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
      Last 30 Days
    </ToggleGroupItem>
    <ToggleGroupItem value="all" className="text-xs px-3 py-1.5 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
      All Time
    </ToggleGroupItem>
  </ToggleGroup>
);

export default DateFilter;
