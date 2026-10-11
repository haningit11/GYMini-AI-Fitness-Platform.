import { useState, useEffect } from "react";
import { Search, LogOut, Building2, Lock, Plus, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const OTHER_GYM = "__other__";

interface GymOption {
  id: string;
  name: string;
  location_city: string | null;
  access_password: string;
  is_verified?: boolean;
}

interface ChangeGymModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChangeGymModal = ({
  open,
  onOpenChange,
}: ChangeGymModalProps) => {
  const { user, authUser, updateProfile, refreshProfile } = useAuth();

  const [gyms, setGyms] = useState<GymOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedGymId, setSelectedGymId] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  const [currentGymId, setCurrentGymId] = useState<string | null>(null);
  const [currentGymVerified, setCurrentGymVerified] = useState<boolean | null>(null);

  // OTHER GYM STATES
  const [showOtherGymForm, setShowOtherGymForm] = useState(false);
  const [customGymName, setCustomGymName] = useState("");
  const [customGymCity, setCustomGymCity] = useState("");

  // ===== LOAD DATA =====
  useEffect(() => {
    if (!open || !authUser) return;

    const loadData = async () => {
      // GET FRESH USER PROFILE
      const { data: freshProfile } = await supabase
        .from("profiles")
        .select("gym_id")
        .eq("user_id", authUser.id)
        .single();

      const freshGymId = freshProfile?.gym_id || null;
      setCurrentGymId(freshGymId);

      // CHECK IF CURRENT GYM IS VERIFIED
      if (freshGymId) {
        const { data: gymData } = await supabase
          .from("gyms")
          .select("is_verified")
          .eq("id", freshGymId)
          .single();
        setCurrentGymVerified(gymData?.is_verified ?? false);
      } else {
        setCurrentGymVerified(null);
      }

      // LOAD VERIFIED GYMS
      const { data: gymList } = await supabase
        .from("gyms")
        .select("id, name, location_city, access_password, is_verified")
        .eq("is_verified", true)
        .order("name", { ascending: true });

      setGyms((gymList as GymOption[]) || []);
    };

    loadData();
  }, [open, authUser]);

  // ===== FILTER GYMS =====
  const filteredGyms = gyms.filter(
    (gym) =>
      gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (gym.location_city
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ??
        false)
  );

  // ===== JOIN GYM =====
  const handleJoinGym = async (gym: GymOption) => {
    if (gym.access_password && gym.access_password.trim()) {
      setSelectedGymId(gym.id);
      setPasswordInput("");
      setShowPasswordPrompt(true);
      return;
    }

    await confirmJoinGym(gym.id, "");
  };

  // ===== CONFIRM JOIN =====
  const confirmJoinGym = async (
    gymId: string,
    password: string
  ) => {
    if (!authUser) return;

    setLoading(true);

    try {
      const gym = gyms.find((g) => g.id === gymId);

      if (gym?.access_password && gym.access_password.trim()) {
        if (password !== gym.access_password) {
          toast.error("❌ Wrong password");
          setLoading(false);
          return;
        }
      }

      await updateProfile({
        gymId,
        gymName: gym?.name,
      });

      await refreshProfile();

      setCurrentGymId(gymId);
      setCurrentGymVerified(gym?.is_verified ?? true);

      setShowPasswordPrompt(false);
      setPasswordInput("");

      toast.success(`Joined ${gym?.name || "gym"}!`);

      onOpenChange(false);
    } catch (error) {
      console.error("Error joining gym:", error);
      toast.error("Failed to join gym");
    } finally {
      setLoading(false);
    }
  };

  // ===== CREATE CUSTOM GYM =====
  const handleCreateCustomGym = async () => {
    if (!authUser) return;

    if (!customGymName.trim() || !customGymCity.trim()) {
      toast.error("Please enter gym name and city");
      return;
    }

    setLoading(true);

    try {
      // CREATE UNVERIFIED GYM
      const { data: newGym, error } = await supabase
        .from("gyms")
        .insert({
          name: customGymName.trim(),
          location_city: customGymCity.trim(),
          is_verified: false,
          access_password: "",
        })
        .select()
        .single();

      if (error || !newGym) {
        throw error;
      }

      // JOIN NEW GYM
      await updateProfile({
        gymId: newGym.id,
        gymName: newGym.name,
      });

      await refreshProfile();

      setCurrentGymId(newGym.id);
      setCurrentGymVerified(false);

      toast.success("Gym created!  Pending admin verification...");

      // RESET FORM
      setCustomGymName("");
      setCustomGymCity("");
      setShowOtherGymForm(false);

      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create custom gym");
    } finally {
      setLoading(false);
    }
  };

  // ===== LEAVE GYM =====
  const handleLeaveGym = async () => {
    if (!authUser) return;

    setLoading(true);

    try {
      await updateProfile({
        gymId: null,
        gymName: null,
      });

      await refreshProfile();

      setCurrentGymId(null);
      setCurrentGymVerified(null);

      toast.success("Left gym");

      onOpenChange(false);
    } catch (error) {
      console.error("Error leaving gym:", error);
      toast.error("Failed to leave gym");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* MAIN MODAL */}
      <Dialog
        open={open && !showPasswordPrompt}
        onOpenChange={onOpenChange}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join a Gym</DialogTitle>

            <DialogDescription>
              {currentGymId
                ? `You're in: ${user?.gymName}`
                : "You're not in a gym yet"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* SEARCH */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />

              <Input
                placeholder="Search gyms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* CURRENT GYM - WITH VERIFICATION STATUS */}
            {currentGymId && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-lg p-3 border ${
                  currentGymVerified === false
                    ? "bg-orange-500/10 border-orange-500/30"
                    : "bg-primary/10 border-primary/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-xs font-semibold mb-2 ${
                      currentGymVerified === false
                        ? "text-orange-600"
                        : "text-primary"
                    }`}>
                      {currentGymVerified === false ? " PENDING VERIFICATION" : "✓ CURRENT GYM"}
                    </p>

                    <p className="text-sm font-medium text-foreground">
                      {user?.gymName}
                    </p>
                  </div>
                  {currentGymVerified === false && (
                    <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 ml-2" />
                  )}
                </div>

                {currentGymVerified === false && (
                  <p className="text-xs text-orange-600 mt-2">
                    This gym is awaiting admin verification. You can still use it, but full access will be granted once verified.
                  </p>
                )}

                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-3 gap-1.5 h-8 text-xs"
                  onClick={handleLeaveGym}
                  disabled={loading}
                >
                  <LogOut className="w-3.5 h-3.5" />

                  {loading ? "Leaving..." : "Leave Gym"}
                </Button>
              </motion.div>
            )}

            {/* GYMS LIST */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {filteredGyms.length === 0 ? (
                <div className="text-center py-6">
                  <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />

                  <p className="text-sm text-muted-foreground">
                    No gyms found
                  </p>
                </div>
              ) : (
                filteredGyms.map((gym) => {
                  const isCurrentGym = currentGymId === gym.id;

                  const hasPassword =
                    gym.access_password &&
                    gym.access_password.trim();

                  return (
                    <motion.button
                      key={gym.id}
                      whileHover={{ scale: 0.98 }}
                      onClick={() =>
                        !isCurrentGym && handleJoinGym(gym)
                      }
                      disabled={isCurrentGym || loading}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        isCurrentGym
                          ? "bg-primary/5 border-primary/30 cursor-not-allowed opacity-50"
                          : "bg-muted border-border hover:border-primary hover:bg-muted/80"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm">
                            {gym.name}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {gym.location_city || "Location unknown"}
                          </p>
                        </div>

                        {hasPassword && (
                          <Lock className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                        )}
                      </div>

                      {isCurrentGym && (
                        <p className="text-xs text-primary font-semibold mt-2">
                          ✓ Current Gym
                        </p>
                      )}
                    </motion.button>
                  );
                })
              )}

              {/* OTHER GYM BUTTON */}
              <motion.button
                whileHover={{ scale: 0.98 }}
                onClick={() =>
                  setShowOtherGymForm(!showOtherGymForm)
                }
                className="w-full text-left p-3 rounded-lg border border-dashed border-border hover:border-primary transition-all"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-muted-foreground" />

                  <p className="text-sm font-medium text-muted-foreground">
                    Other / My gym isn't listed
                  </p>
                </div>
              </motion.button>
            </div>

            {/* CUSTOM GYM FORM */}
            {showOtherGymForm && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 border rounded-lg p-3"
              >
                <Input
                  placeholder="Gym Name"
                  value={customGymName}
                  onChange={(e) =>
                    setCustomGymName(e.target.value)
                  }
                />

                <Input
                  placeholder="City"
                  value={customGymCity}
                  onChange={(e) =>
                    setCustomGymCity(e.target.value)
                  }
                />

                <Button
                  onClick={handleCreateCustomGym}
                  disabled={
                    loading ||
                    !customGymName.trim() ||
                    !customGymCity.trim()
                  }
                  className="w-full"
                >
                  {loading
                    ? "Creating..."
                    : "Create Custom Gym"}
                </Button>
              </motion.div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* PASSWORD MODAL */}
      <Dialog
        open={showPasswordPrompt}
        onOpenChange={setShowPasswordPrompt}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Enter Gym Password</DialogTitle>

            <DialogDescription>
              This gym requires a password to join.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password..."
              value={passwordInput}
              onChange={(e) =>
                setPasswordInput(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && selectedGymId) {
                  confirmJoinGym(
                    selectedGymId,
                    passwordInput
                  );
                }
              }}
              disabled={loading}
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setShowPasswordPrompt(false)
                }
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>

              <Button
                onClick={() =>
                  selectedGymId &&
                  confirmJoinGym(
                    selectedGymId,
                    passwordInput
                  )
                }
                disabled={
                  loading || !passwordInput.trim()
                }
                className="flex-1"
              >
                {loading ? "Joining..." : "Join"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};