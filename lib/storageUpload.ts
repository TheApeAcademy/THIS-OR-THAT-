"use client";

import { createClient } from "@/lib/supabase/client";

export interface UploadOptions {
  onProgress?: (pct: number) => void;
  retries?: number;
}

/**
 * Uploads directly against the Storage REST endpoint via XHR (rather than
 * supabase-js's fetch-based `.upload()`) so we get real byte-level progress
 * events, plus a couple of retries for a flaky connection.
 */
export async function uploadToStorage(
  bucket: string,
  path: string,
  file: Blob,
  { onProgress, retries = 2 }: UploadOptions = {}
): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
  const accessToken = session.access_token;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
        xhr.setRequestHeader("apikey", anonKey);
        xhr.setRequestHeader("x-upsert", "false");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        const form = new FormData();
        form.append("cacheControl", "3600");
        form.append("", file);
        xhr.send(form);
      });
      onProgress?.(100);
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    } catch (e) {
      lastError = e;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Upload failed");
}
