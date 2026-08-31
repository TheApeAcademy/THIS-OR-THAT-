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
 * Captures both a headshot (small circular avatars everywhere) and a
 * full-body render (contexts like the share card that want the whole
 * figure) so neither has to compromise on framing. Returns the permanent
 * model URL once everything is uploaded and persisted.
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

  const [headshotBlob, fullbodyBlob] = await Promise.all([
    captureGlbSnapshot(modelUrl, "headshot"),
    captureGlbSnapshot(modelUrl, "fullbody"),
  ]);

  const headshotPath = `${user.id}/headshot.png`;
  const fullbodyPath = `${user.id}/fullbody.png`;
  const [{ error: headshotError }, { error: fullbodyError }] = await Promise.all([
    supabase.storage.from("avatars").upload(headshotPath, headshotBlob, { upsert: true, contentType: "image/png" }),
    supabase.storage.from("avatars").upload(fullbodyPath, fullbodyBlob, { upsert: true, contentType: "image/png" }),
  ]);
  if (headshotError) throw headshotError;
  if (fullbodyError) throw fullbodyError;

  const {
    data: { publicUrl: headshotUrl },
  } = supabase.storage.from("avatars").getPublicUrl(headshotPath);
  const {
    data: { publicUrl: fullbodyUrl },
  } = supabase.storage.from("avatars").getPublicUrl(fullbodyPath);

  await updateAvatar3DAction(modelUrl, headshotUrl, fullbodyUrl, exported.avatarId);

  return modelUrl;
}
