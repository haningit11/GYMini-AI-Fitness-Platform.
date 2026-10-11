import { useState, useMemo } from "react"; 
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

interface WeightPoint { date: string; weight: number }
interface EnergyPoint { week: string; calories: number }
interface StrengthPoint { [key: string]: any }

interface ProgressChartsProps {
  weightData: WeightPoint[];
  energyData: EnergyPoint[];
  strengthData: StrengthPoint[];
}

const ProgressCharts = ({ weightData, energyData, strengthData }: ProgressChartsProps) => {
  const [tab, setTab] = useState("weight");

  // 1. GET ALL EXERCISES: Find every exercise name in the data
  const allAvailableExercises = useMemo(() => {
    const names = new Set<string>();
    strengthData.forEach(day => {
      Object.keys(day).forEach(key => {
        if (key !== 'date' && day[key] !== null && day[key] > 0) {
          names.add(key);
        }
      });
    });
    return Array.from(names).sort();
  }, [strengthData]);

  // 2. SELECTION STATE: Start with the first 4 exercises selected by default
  const [selectedExercises, setSelectedExercises] = useState<string[]>(
    allAvailableExercises.slice(0, 4)
  );

  const toggleExercise = (name: string) => {
    setSelectedExercises(prev => 
      prev.includes(name) 
        ? prev.filter(item => item !== name) 
        : [...prev, name]
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      if (isValid(date)) return format(date, "MMM d");
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  const colors = [
    "hsl(199 80% 50%)", "hsl(160 55% 48%)", "hsl(42 90% 55%)",
    "hsl(10 86% 63%)", "hsl(280 85% 65%)", "hsl(25 97% 53%)",
  ];

  return (
    <div className="rounded-2xl bg-card border border-border p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-lg font-display font-bold text-foreground">Interactive Analytics</h2>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="weight">Weight</TabsTrigger>
            <TabsTrigger value="energy">Energy</TabsTrigger>
            <TabsTrigger value="strength">Strength</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* --- FILTER BUTTONS SECTION --- */}
      {tab === "strength" && allAvailableExercises.length > 0 && (
        <div className="mb-6 p-4 bg-secondary/20 rounded-xl border border-border/50">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Select Exercises to Compare:
          </p>
          <div className="flex flex-wrap gap-2">
            {allAvailableExercises.map((ex) => (
              <button
                key={ex}
                onClick={() => toggleExercise(ex)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedExercises.includes(ex)
                    ? "bg-primary text-primary-foreground shadow-sm scale-105"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- CHART SECTION --- */}
      {tab === "weight" && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weightData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={formatDate} />
            <YAxis tick={{ fontSize: 11 }} domain={["dataMin - 2", "dataMax + 2"]} />
            <Tooltip labelFormatter={formatDate} contentStyle={{ borderRadius: "12px" }} />
            <Line type="monotone" dataKey="weight" stroke="hsl(199 80% 50%)" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      )}

      {tab === "energy" && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={energyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} tickFormatter={formatDate} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip labelFormatter={formatDate} contentStyle={{ borderRadius: "12px" }} />
            <Line type="monotone" dataKey="calories" stroke="hsl(160 55% 48%)" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
      
      {tab === "strength" && (
        strengthData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={strengthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={formatDate} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={formatDate} contentStyle={{ borderRadius: "12px" }} />
              
              {/* Only render lines for SELECTED exercises */}
              {selectedExercises.map((exerciseName, idx) => (
                <Line
                  key={exerciseName}
                  type="monotone"
                  dataKey={exerciseName}
                  name={exerciseName}
                  stroke={colors[idx % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground text-sm text-center px-4 gap-3">
            <Dumbbell className="w-8 h-8 text-muted-foreground" />
            <p>Log weights during workouts to track your strength progress here.</p>
          </div>
        )
      )}
    </div>
  );
};

export default ProgressCharts;