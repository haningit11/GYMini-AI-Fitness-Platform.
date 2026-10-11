import { Activity } from "lucide-react";

interface BMICardProps {
  weight: number | null;
  height: number | null;
}

const BMICard = ({ weight, height }: BMICardProps) => {
  if (!weight || !height) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6 text-center">
        <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Add weight &amp; height in your profile to see BMI</p>
      </div>
    );
  }

  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);
  const category = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
  const color = bmi < 18.5 ? "text-sky-400" : bmi < 25 ? "text-emerald-400" : bmi < 30 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="rounded-2xl bg-card border border-border p-6">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-5 h-5 text-sky-400" />
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">BMI</h3>
      </div>
      <p className={`text-3xl font-display font-bold ${color}`}>{bmi.toFixed(1)}</p>
      <p className="text-sm text-muted-foreground mt-1">{category}</p>
    </div>
  );
};

export default BMICard;
