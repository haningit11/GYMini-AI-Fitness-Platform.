import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio not available
  }
};

export const useUnreadDMs = () => {
  const { authUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const prevCountRef = useRef(0);
  const initializedRef = useRef(false);

  const fetchCount = useCallback(async () => {
    if (!authUser) return;
    const { count } = await supabase
      .from("direct_messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", authUser.id)
      .eq("read", false);

    const newCount = count || 0;
    
    // Play sound if count increased (skip initial load)
    if (initializedRef.current && newCount > prevCountRef.current) {
      playNotificationSound();
    }
    
    prevCountRef.current = newCount;
    initializedRef.current = true;
    setUnreadCount(newCount);
  }, [authUser]);

  useEffect(() => {
    if (!authUser) return;

    fetchCount();

    const channel = supabase
      .channel("unread-dm-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "direct_messages" },
        () => fetchCount()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [authUser, fetchCount]);

  return unreadCount;
};
