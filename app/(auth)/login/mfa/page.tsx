import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MfaChallenge } from "@/components/MfaChallenge";

export default async function LoginMfaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!aal || aal.nextLevel !== "aal2" || aal.currentLevel === "aal2") redirect("/home");

  return <MfaChallenge />;
}
