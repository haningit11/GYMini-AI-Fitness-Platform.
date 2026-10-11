import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploadProps {
  avatarUrl?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg";
  onUploaded?: (url: string) => void;
}

export const AvatarUpload = ({
  avatarUrl,
  name = "User",
  size = "md",
  onUploaded,
}: AvatarUploadProps) => {
  const { authUser } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-20 h-20",
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Max 5MB allowed",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Get file extension
      const fileExt = file.name.split(".").pop();
      const filePath = `${authUser.id}/avatar.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      // Get public URL
     // ... after your upload success ...

// 1. Get the public URL
const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

if (data?.publicUrl) {
  // 2. ADD THIS LINE: Add a timestamp to the end of the URL
  // This turns ".../avatar.png" into ".../avatar.png?t=1714665722"
  const cacheBustedUrl = `${data.publicUrl}?t=${new Date().getTime()}`;

  // 3. Update profile with the NEW cache-busted URL
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: cacheBustedUrl }) // Use the new variable here
    .eq("user_id", authUser.id);

  if (updateError) {
    console.error("Update error:", updateError);
    throw updateError;
  }

  // 4. Update local state with the cache-busted URL
  onUploaded?.(cacheBustedUrl);

  toast({
    title: "Success!",
    description: "Avatar updated successfully",
  });
}
    } catch (error: any) {
      console.error("Avatar upload failed:", error);
      toast({
        title: "Upload failed",
        description: error?.message || "Could not upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Generate initials from name
  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
        aria-label="Upload avatar"
      />

      <button
        onClick={() => !uploading && fileInputRef.current?.click()}
        disabled={uploading}
        className={`${sizeClasses[size]} relative rounded-full group cursor-pointer shrink-0 flex items-center justify-center overflow-hidden transition-transform hover:scale-105 disabled:cursor-not-allowed`}
        aria-label="Upload profile picture"
      >
        {/* Image or Initials */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide image if it fails to load
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}

        {/* Fallback: Show initials if no image or image failed to load */}
        {!avatarUrl && (
          <div className="w-full h-full gradient-hero flex items-center justify-center text-white font-bold text-sm">
            {initials}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Camera className="w-5 h-5 text-white" />
          )}
        </div>

        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
        )}
      </button>
    </>
  );
};