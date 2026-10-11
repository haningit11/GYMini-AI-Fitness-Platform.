import { Input } from "@/components/ui/input";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
}

interface Props {
  exercises: Exercise[];
  onChange: (exercises: Exercise[]) => void;
}

const EditableExerciseList = ({ exercises, onChange }: Props) => {
  const update = (idx: number, field: keyof Exercise, value: string | number) => {
    const next = exercises.map((ex, i) =>
      i === idx ? { ...ex, [field]: value } : ex
    );
    onChange(next);
  };

  return (
    <ul className="space-y-2">
      {exercises.map((ex, i) => (
        <li key={i} className="flex items-center gap-2 text-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
          <Input
            value={ex.name}
            onChange={(e) => update(i, "name", e.target.value)}
            className="h-7 text-sm bg-background border-border px-2 flex-1"
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="number"
            value={ex.sets}
            onChange={(e) => update(i, "sets", parseInt(e.target.value) || 0)}
            className="h-7 text-sm bg-background border-border px-2 w-14 text-center"
            min={1}
            max={99}
          />
          <span className="text-muted-foreground">×</span>
          <Input
            value={ex.reps}
            onChange={(e) => update(i, "reps", e.target.value)}
            className="h-7 text-sm bg-background border-border px-2 w-20"
          />
        </li>
      ))}
    </ul>
  );
};

export default EditableExerciseList;
