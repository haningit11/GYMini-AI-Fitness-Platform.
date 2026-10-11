import { useState, useEffect, useMemo } from "react";
import { Dumbbell, ChevronRight, Ruler, Weight, Target, MapPin, Building2, Search, User, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const levels = ["Beginner", "Intermediate", "Advanced"];
const goals = ["Bulking", "Cutting", "Maintenance"];
const muscles = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Full Body"];
const genders = ["Male", "Female", "Other"];
const OTHER_GYM = "__other__";

interface GymOption {
  id: string;
  name: string;
  location_city: string | null;
}

const Onboarding = () => {
  const [step, setStep] = useState(0);

  // Step 1 — Identity
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // Step 2 — Body stats
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");

  // Step 3 — Goals
  const [level, setLevel] = useState("");
  const [goal, setGoal] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [primaryMuscle, setPrimaryMuscle] = useState("");

  // Step 4 — Gym
  const [selectedGymId, setSelectedGymId] = useState("");
  const [customGymName, setCustomGymName] = useState("");
  const [gymCity, setGymCity] = useState("");
  const [gymSearch, setGymSearch] = useState("");
  const [verifiedGyms, setVerifiedGyms] = useState<GymOption[]>([]);

  const [isSaving, setIsSaving] = useState(false);

  const navigate = useNavigate();
  const { updateProfile, authUser } = useAuth();

  useEffect(() => {
    supabase
      .from("gyms")
      .select("id, name, location_city")
      .eq("is_verified", true)
      .order("name")
      .then(({ data }) => setVerifiedGyms((data as GymOption[]) ?? []));
  }, []);

  const filteredGyms = useMemo(() => {
    if (!gymSearch.trim()) return verifiedGyms;
    const q = gymSearch.toLowerCase();
    return verifiedGyms.filter((g) => g.name.toLowerCase().includes(q) || g.location_city?.toLowerCase().includes(q));
  }, [verifiedGyms, gymSearch]);

  const isHome = selectedGymId === "__home__";
  const isOther = selectedGymId === OTHER_GYM;
  const selectedGym = verifiedGyms.find((g) => g.id === selectedGymId);

  const blockInvalidKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
      e.preventDefault();
    }
  };

  const steps = [
    {
      title: "About You",
      subtitle: "Let's get to know you",
      icon: User,
      content: (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">Gender</label>
            <div className="grid grid-cols-3 gap-3">
              {genders.map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all border ${gender === g ? "gradient-hero text-primary-foreground border-transparent shadow-hero" : "bg-muted text-foreground border-border hover:border-primary"}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Date of Birth</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max="2010-12-31"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
          </div>
        </div>
      ),
      valid: !!gender && !!dateOfBirth,
    },
    {
      title: "Your Body Stats",
      subtitle: "Help the AI personalize your workouts",
      icon: Ruler,
      content: (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Height (cm)</label>
              <div className="relative">
                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    onKeyDown={blockInvalidKeys}
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (e.target.value && (v < 100 || v > 250)) {
                        setHeight(String(Math.min(250, Math.max(100, v))));
                      }
                    }}
                    placeholder="175"
                    min="100"
                    max="250"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Weight (kg)</label>
              <div className="relative">
                <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                   type="number"
                   value={weight}
                   onKeyDown={blockInvalidKeys}
                   onChange={(e) => setWeight(e.target.value)}
                   onBlur={(e) => {
                     const v = Number(e.target.value);
                     if (e.target.value && (v < 30 || v > 300)) {
                       setWeight(String(Math.min(300, Math.max(30, v))));
                     }
                   }}
                   placeholder="70"
                   min="30"
                   max="300"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Body Fat % <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="number"
              value={bodyFat}
              onKeyDown={blockInvalidKeys}
              onChange={(e) => setBodyFat(e.target.value)}
              onBlur={(e) => {
                const v = Number(e.target.value);
                if (e.target.value && (v < 1 || v > 60)) {
                  setBodyFat(String(Math.min(60, Math.max(1, v))));
                }
              }}
              placeholder="e.g. 18"
              min="1"
              max="60"
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
            <p className="text-xs text-muted-foreground mt-1.5">Don't know it? Leave it blank, you can add it later.</p>
          </div>
        </div>
      ),
      valid: !!height && !!weight,
    },
    {
      title: "Your Goals",
      subtitle: "We'll build your plan around these",
      icon: Target,
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">Experience Level</label>
            <div className="grid grid-cols-3 gap-3">
              {levels.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all border ${level === l ? "gradient-hero text-primary-foreground border-transparent shadow-hero" : "bg-muted text-foreground border-border hover:border-primary"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">Fitness Goal</label>
            <div className="grid grid-cols-3 gap-3">
              {goals.map((g) => (
                <button
                  key={g}
                  onClick={() => setGoal(g)}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all border ${goal === g ? "bg-secondary text-secondary-foreground border-transparent" : "bg-muted text-foreground border-border hover:border-secondary"}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">Primary Muscle Focus</label>
            <div className="grid grid-cols-4 gap-2">
              {muscles.map((m) => (
                <button
                  key={m}
                  onClick={() => setPrimaryMuscle(m)}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all border ${primaryMuscle === m ? "gradient-hero text-primary-foreground border-transparent" : "bg-muted text-foreground border-border hover:border-primary"}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Target Weight (kg) <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
                type="number"
                value={targetWeight}
                onKeyDown={blockInvalidKeys}
                onChange={(e) => setTargetWeight(e.target.value)}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (e.target.value && (v < 30 || v > 300)) {
                    setTargetWeight(String(Math.min(300, Math.max(30, v))));
                  }
                }}
                placeholder="e.g. 75"
                min="30"
                max="300"
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>
        </div>
      ),
      valid: !!level && !!goal && !!primaryMuscle,
    },
    {
      title: "Your Gym",
      subtitle: "Connect with others at your gym",
      icon: Building2,
      content: (
        <div className="space-y-4">
          <button
            onClick={() => {
              setSelectedGymId("__home__");
              setCustomGymName("");
              setGymCity("");
              setGymSearch("");
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${isHome ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary"}`}
          >
            <MapPin className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">I train at home / No gym</p>
              <p className="text-xs text-muted-foreground">Skip gym selection entirely</p>
            </div>
            {isHome && <div className="w-2 h-2 rounded-full bg-primary" />}
          </button>

          {!isHome && (
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Select Your Gym</label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={gymSearch}
                  onChange={(e) => setGymSearch(e.target.value)}
                  placeholder="Search gyms…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                />
              </div>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-border bg-card divide-y divide-border">
                {filteredGyms.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGymId(g.id)}
                    className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors hover:bg-muted ${selectedGymId === g.id ? "bg-primary/10" : ""}`}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{g.name}</p>
                      {g.location_city && <p className="text-xs text-muted-foreground">{g.location_city}</p>}
                    </div>
                    {selectedGymId === g.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </button>
                ))}
                {filteredGyms.length === 0 && verifiedGyms.length > 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">No gyms match your search.</p>
                )}
                {verifiedGyms.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">No verified gyms yet.</p>
                )}
                <button
                  onClick={() => setSelectedGymId(OTHER_GYM)}
                  className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors hover:bg-muted ${isOther ? "bg-primary/10" : ""}`}
                >
                  <p className="text-sm font-medium text-muted-foreground italic">Other / My gym isn't listed</p>
                  {isOther && <div className="w-2 h-2 rounded-full bg-primary" />}
                </button>
              </div>
            </div>
          )}

          {isOther && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Gym Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={customGymName}
                    onChange={(e) => setCustomGymName(e.target.value)}
                    placeholder="Powerhouse Gym"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">City</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={gymCity}
                    onChange={(e) => setGymCity(e.target.value)}
                    placeholder="Beirut"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Your gym will be submitted for verification by an admin.</p>
            </motion.div>
          )}
        </div>
      ),
      valid: isHome || (isOther ? !!customGymName && !!gymCity : !!selectedGymId) && selectedGymId !== null,
    },
  ];

  const currentStep = steps[step];
const handleNext = async () => {
    // 1. Progress to next step if not at the end
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }

    // 2. We are on the last step, start saving
    setIsSaving(true);

    try {
      let gymId: string | null = null;
      let gymName = "";

      // Handle Gym Logic
      if (isHome) {
        gymId = null;
        gymName = "Home Gym";
      } else if (isOther) {
        // Create new gym record
        const { data: newGym, error: gymError } = await supabase
          .from("gyms")
          .insert({
            name: customGymName.trim(),
            location_city: gymCity.trim(),
            is_verified: false,
            access_password: "1234",
          })
          .select()
          .single();

        if (gymError || !newGym) {
          throw new Error(gymError?.message || "Failed to create gym");
        }

        gymId = newGym.id;
        gymName = newGym.name;
      } else {
        // Use selected verified gym
        const gym = verifiedGyms.find((g) => g.id === selectedGymId);
        if (!gym) throw new Error("Please select a valid gym");
        
        gymId = gym.id;
        gymName = gym.name;
      }

      // 3. Update the Profile
      // Wrap in a timeout or await to ensure Supabase responds
      await updateProfile({
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        level,
        goal,
        gymId: gymId,
        gymName: gymName,
        onboarded: true,
        gender,
        dateOfBirth,
        targetWeight: targetWeight ? parseFloat(targetWeight) : undefined,
        primaryMuscle,
        bodyFatPercentage: bodyFat ? parseFloat(bodyFat) : undefined,
      });

      toast.success("Profile updated successfully!");
      
      // Delay navigation slightly to let state settle if needed
      setTimeout(() => navigate("/dashboard"), 100);

    } catch (error: any) {
      console.error("Onboarding Error:", error);
      toast.error(error.message || "An unexpected error occurred");
      // CRITICAL: Reset loading state so user can try again
      setIsSaving(false); 
    }
    // Note: We don't put setIsSaving(false) in 'finally' 
    // because if successful, we are navigating away anyway.
  };
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-10 justify-center">
          <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-display font-bold text-foreground">GYMini</span>
        </div>

        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? "gradient-hero" : "bg-muted"}`}
            />
          ))}
        </div>

        <div className="bg-card rounded-2xl p-8 border border-border shadow-card">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center">
                  <currentStep.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground">{currentStep.title}</h2>
                  <p className="text-sm text-muted-foreground">{currentStep.subtitle}</p>
                </div>
              </div>
              {currentStep.content}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-muted transition-colors"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={handleNext}
              disabled={!currentStep.valid || isSaving}
              className="px-8 py-3 rounded-xl gradient-hero text-primary-foreground font-display font-bold shadow-hero hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? "Saving..." : step === steps.length - 1 ? "Finish Setup" : "Continue"}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Step {step + 1} of {steps.length}
        </p>
      </motion.div>
    </div>
  );
};

export default Onboarding;
