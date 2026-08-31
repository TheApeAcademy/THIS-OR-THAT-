import { createClient } from "@/lib/supabase/client";
import { captureGlbSnapshot } from "@/lib/avatarSnapshot";
import { updateAvatar3DAction } from "@/lib/actions/avatar";

interface ExportedAvatar {
  url: string;
  avatarId: string;
}

/**
 * Copies an exported avatar into our own Supabase Storage instead of trusting
 * the creator vendor's CDN to keep hosting it forever (Ready Player Me's own
 * shutdown in Jan 2026 is why this app needed rebuilding once already).
 * Returns the permanent model URL once everything is uploaded and persisted.
 */
export async function saveExportedAvatar(exported: ExportedAvatar): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const modelBlob = await (await fetch(exported.url)).blob();
  const modelPath = `${user.id}/model.glb`;
  const { error: modelError } = await supabase.storage
    .from("avatars")
    .upload(modelPath, modelBlob, { upsert: true, contentType: "model/gltf-binary" });
  if (modelError) throw modelError;
  const {
    data: { publicUrl: modelUrl },
  } = supabase.storage.from("avatars").getPublicUrl(modelPath);

  const snapshotBlob = await captureGlbSnapshot(modelUrl);
  const snapshotPath = `${user.id}/snapshot.png`;
  const { error: snapshotError } = await supabase.storage
    .from("avatars")
    .upload(snapshotPath, snapshotBlob, { upsert: true, contentType: "image/png" });
  if (snapshotError) throw snapshotError;
  const {
    data: { publicUrl: snapshotUrl },
  } = supabase.storage.from("avatars").getPublicUrl(snapshotPath);

  await updateAvatar3DAction(modelUrl, snapshotUrl, exported.avatarId);

  return modelUrl;
}
