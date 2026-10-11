import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";

interface MuscleRadarProps {
  data: Array<{ name: string; value: number }>;
}

const MuscleRadar = ({ data }: MuscleRadarProps) => (
  <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
    <h2 className="text-lg font-display font-bold text-foreground mb-1">Muscle Group Radar</h2>
    <p className="text-sm text-muted-foreground mb-6">Training distribution across muscle groups</p>
    {data.length === 0 ? (
      <p className="text-center text-muted-foreground py-8">No exercise data available.</p>
    ) : (
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
          <PolarRadiusAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <Radar
            name="Exercises"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              color: "hsl(var(--foreground))",
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    )}
  </div>
);

export default MuscleRadar;
