import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Send, ArrowLeft, MessageCircle, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

interface DM {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_name: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface Conversation {
  partnerId: string;
  partnerName: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
}

interface UserOption {
  user_id: string;
  name: string;
}

const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    className="flex justify-start"
  >
    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5 flex items-center gap-1">
      <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
      <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
      <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
    </div>
  </motion.div>
);

const DirectMessages = () => {
  const { authUser, user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<{ id: string; name: string } | null>(null);
  const [messages, setMessages] = useState<DM[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch all users
  useEffect(() => {
    if (!authUser) return;
    supabase
      .from("profiles")
      .select("user_id, name")
      .neq("user_id", authUser.id)
      .then(({ data }) => { if (data) setUsers(data); });
  }, [authUser]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!authUser) return;
    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`sender_id.eq.${authUser.id},receiver_id.eq.${authUser.id}`)
      .order("created_at", { ascending: false });

    if (!data) return;
    const dms = data as DM[];
    const convMap = new Map<string, Conversation>();

    dms.forEach((dm) => {
      const partnerId = dm.sender_id === authUser.id ? dm.receiver_id : dm.sender_id;
      if (!convMap.has(partnerId)) {
        const partnerName = dm.sender_id === authUser.id
          ? (users.find((u) => u.user_id === partnerId)?.name || "User")
          : dm.sender_name;
        convMap.set(partnerId, { partnerId, partnerName, lastMessage: dm.content, lastTime: dm.created_at, unread: 0 });
      }
      if (dm.receiver_id === authUser.id && !dm.read) {
        convMap.get(partnerId)!.unread++;
      }
    });

    setConversations(Array.from(convMap.values()));
  }, [authUser, users]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Subscribe to DM changes
  useEffect(() => {
    if (!authUser) return;
    const channel = supabase
      .channel("dm-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "direct_messages" }, (payload) => {
        const dm = payload.new as DM;
        if (payload.eventType === "UPDATE") {
          // Update read status in current messages
          setMessages((prev) => prev.map((m) => m.id === dm.id ? { ...m, read: dm.read } : m));
          fetchConversations();
          return;
        }
        if (dm.sender_id === authUser.id || dm.receiver_id === authUser.id) {
          if (selectedPartner && (dm.sender_id === selectedPartner.id || dm.receiver_id === selectedPartner.id)) {
            setMessages((prev) => [...prev, dm]);
          }
          fetchConversations();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [authUser, selectedPartner, fetchConversations]);

  // Fetch messages & mark as read when opening conversation
  useEffect(() => {
    if (!authUser || !selectedPartner) return;

    const fetchAndMarkRead = async () => {
      const { data } = await supabase
        .from("direct_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${authUser.id},receiver_id.eq.${selectedPartner.id}),and(sender_id.eq.${selectedPartner.id},receiver_id.eq.${authUser.id})`
        )
        .order("created_at", { ascending: true })
        .limit(100);

      if (data) {
        setMessages(data as DM[]);
        // Mark unread messages as read
        const unreadIds = (data as DM[])
          .filter((m) => m.receiver_id === authUser.id && !m.read)
          .map((m) => m.id);
        if (unreadIds.length > 0) {
          await supabase
            .from("direct_messages")
            .update({ read: true })
            .in("id", unreadIds);
        }
      }
    };

    fetchAndMarkRead();
  }, [authUser, selectedPartner]);

  // Typing indicator via broadcast channel
  useEffect(() => {
    if (!authUser || !selectedPartner) return;

    const channelName = [authUser.id, selectedPartner.id].sort().join("-");
    const channel = supabase.channel(`typing-${channelName}`);

    channel
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload.userId !== authUser.id) {
          setPartnerTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setPartnerTyping(false), 2000);
        }
      })
      .subscribe();

    typingChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      typingChannelRef.current = null;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setPartnerTyping(false);
    };
  }, [authUser, selectedPartner]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partnerTyping]);

  const broadcastTyping = useCallback(() => {
    if (!typingChannelRef.current || !authUser) return;
    typingChannelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: authUser.id },
    });
  }, [authUser]);

  const handleInputChange = (val: string) => {
    setNewMessage(val);
    broadcastTyping();
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !authUser || !selectedPartner || sending) return;
    setSending(true);
    await supabase.from("direct_messages").insert([{
      sender_id: authUser.id,
      receiver_id: selectedPartner.id,
      sender_name: user?.name || "Anonymous",
      content: newMessage.trim(),
    }]);
    setNewMessage("");
    setSending(false);
  };

  const startConversation = (u: UserOption) => {
    setSelectedPartner({ id: u.user_id, name: u.name });
    setShowUserPicker(false);
  };

  // === Conversation list ===
  if (!selectedPartner) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <span className="font-display font-semibold text-foreground text-sm">Messages</span>
          <Button variant="ghost" size="sm" onClick={() => setShowUserPicker(!showUserPicker)} className="text-primary text-xs">
            + New
          </Button>
        </div>

        {showUserPicker && (
          <div className="p-3 border-b border-border space-y-1 max-h-40 overflow-y-auto">
            {users.map((u) => (
              <button
                key={u.user_id}
                onClick={() => startConversation(u)}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-full gradient-hero flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                  {u.name?.[0]?.toUpperCase() || "?"}
                </div>
                <span className="text-sm text-foreground font-medium truncate">{u.name}</span>
              </button>
            ))}
            {users.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No other users yet</p>}
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0">
          {conversations.length === 0 && !showUserPicker && (
            <div className="text-center py-10">
              <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1">Tap "+ New" to start one</p>
            </div>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.partnerId}
              onClick={() => setSelectedPartner({ id: conv.partnerId, name: conv.partnerName })}
              className="w-full flex items-center gap-3 p-4 border-b border-border hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                {conv.partnerName?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-foreground truncate">{conv.partnerName}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(conv.lastTime).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <span className="w-5 h-5 rounded-full gradient-hero text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                  {conv.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // === Chat view ===
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => setSelectedPartner(null)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-7 h-7 rounded-full gradient-hero flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
          {selectedPartner.name?.[0]?.toUpperCase() || "?"}
        </div>
        <span className="font-display font-semibold text-foreground text-sm truncate">{selectedPartner.name}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">Start the conversation</p>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isOwn = msg.sender_id === authUser?.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isOwn
                      ? "gradient-hero text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : ""}`}>
                    <span className={`text-[10px] ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {isOwn && (
                      msg.read ? (
                        <CheckCheck className="w-3 h-3 text-primary-foreground/80" />
                      ) : (
                        <Check className="w-3 h-3 text-primary-foreground/50" />
                      )
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
          {partnerTyping && <TypingIndicator />}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-3 flex gap-2">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          className="flex-1"
        />
        <Button
          onClick={handleSend}
          disabled={!newMessage.trim() || sending}
          size="icon"
          className="gradient-hero text-primary-foreground border-0 shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default DirectMessages;
