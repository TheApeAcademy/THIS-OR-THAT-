"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateProfilePhotoAction } from "@/lib/actions/profilePhoto";
import { Avatar } from "@/components/ui/Avatar";

export function ProfilePhotoUpload({
  username,
  photoUrl,
  size = 96,
}: {
  username: string;
  photoUrl: string | null;
  size?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [optimisticUrl, setOptimisticUrl] = useState(photoUrl);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    const localPreview = URL.createObjectURL(file);
    setOptimisticUrl(localPreview);

    startTransition(async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/photo.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("profile-photos")
          .upload(path, file, { upsert: true, contentType: file.type });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
        await updateProfilePhotoAction(data.publicUrl);
        setOptimisticUrl(data.publicUrl);
      } catch {
        setOptimisticUrl(photoUrl);
        setError("Couldn't upload photo — try again.");
      }
    });
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="tap-scale group relative block overflow-hidden rounded-full"
        disabled={isPending}
      >
        <Avatar name={username} src={optimisticUrl} size={size} />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/20" />
        {isPending && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 text-xs font-semibold text-white">
            Uploading…
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {error && <p className="mt-1 text-center text-xs text-danger">{error}</p>}
    </div>
  );
}
