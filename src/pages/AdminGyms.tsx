import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import GymManagement from "@/components/admin/GymManagement";

const AdminGyms = () => {
  const [gyms, setGyms] = useState<any[]>([]);

// Inside AdminGyms.tsx
const fetchGyms = async () => {
  const { data, error } = await supabase
    .from("gyms")
    .select("*") // Just get everything from gyms, no joins
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching gyms:", error);
    return;
  }
  setGyms(data ?? []);
};

  useEffect(() => { fetchGyms(); }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <GymManagement gyms={gyms} onRefresh={fetchGyms} />
    </div>
  );
};

export default AdminGyms;
