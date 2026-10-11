import { supabase } from "@/integrations/supabase/client";

type LogAction =
  | "login"
  | "login_failed"
  | "logout"
  | "role_change"
  | "gym_verified"
  | "gym_deleted"
  | "gym_owner_assigned"
  | "profile_update"
  | "user_suspended"
  | "user_deleted";

export async function logAction(
  action: LogAction,
  details: Record<string, unknown> = {},
  userId?: string
) {
  try {
    const uid = userId ?? (await supabase.auth.getUser()).data.user?.id ?? null;
    await (supabase as any).from("system_logs").insert({
      user_id: uid,
      action,
      details,
    });
  } catch {
    // Silently fail 
  }
}
