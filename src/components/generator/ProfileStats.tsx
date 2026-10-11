import { User, Ruler, Weight, Target, TrendingUp, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/contexts/AuthContext";

interface ProfileStatsProps {
  user: UserProfile;
  onEditToggle: () => void;
  editing: boolean;
}

const ProfileStats = ({ user, onEditToggle, editing }: ProfileStatsProps) => (
  <div className="bg-card rounded-2xl p-6 border border-border shadow-card mb-6">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Current Profile</h2>
      </div>
      <Button
        variant={editing ? "secondary" : "outline"}
        size="sm"
        className="text-xs"
        onClick={onEditToggle}
      >
        <Pencil className="w-3 h-3 mr-1" />
        {editing ? "Using profile defaults" : "Edit for this session"}
      </Button>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { icon: Ruler, label: "Height", value: user.height ? `${user.height} cm` : "—" },
        { icon: Weight, label: "Weight", value: user.weight ? `${user.weight} kg` : "—" },
        { icon: TrendingUp, label: "Level", value: user.level || "—" },
        { icon: Target, label: "Goal", value: user.goal || "—" },
      ].map((s) => (
        <div key={s.label} className="bg-muted rounded-xl p-3 text-center">
          <s.icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">{s.label}</p>
          <p className="text-sm font-semibold text-foreground truncate">{s.value}</p>
        </div>
      ))}
    </div>
  </div>
);

export default ProfileStats;
