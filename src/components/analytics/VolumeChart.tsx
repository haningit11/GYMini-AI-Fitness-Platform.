import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface VolumeChartProps {
  data: Array<{ date: string; duration: number; calories: number }>;
}

const VolumeChart = ({ data }: VolumeChartProps) => (
  <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
    <h2 className="text-lg font-display font-bold text-foreground mb-1">Training Volume</h2>
    <p className="text-sm text-muted-foreground mb-6">Duration (min) & calories per session</p>
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={(v) => {
            const d = new Date(v);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }}
        />
        <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "12px",
            color: "hsl(var(--foreground))",
          }}
        />
        <Bar dataKey="duration" name="Duration (min)" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
        <Bar dataKey="calories" name="Calories" fill="hsl(var(--secondary))" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default VolumeChart;
