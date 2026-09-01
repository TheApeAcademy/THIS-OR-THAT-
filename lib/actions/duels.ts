"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAX_LABEL_LENGTH = 60;
const MAX_STATEMENT_LENGTH = 220;
const MAX_PROMPT_LENGTH = 200;

export interface CreateDuelInput {
  prompt: string | null;
  categoryId: string | null;
  label: string;
  statement: string | null;
  /** null = an open callout anyone can claim; otherwise a direct challenge. */
  targetUserId: string | null;
}

export async function createDuelChallengeAction(input: CreateDuelInput): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const label = input.label.trim();
  if (!label) throw new Error("Your stance needs a label.");
  if (label.length > MAX_LABEL_LENGTH) throw new Error(`Keep it under ${MAX_LABEL_LENGTH} characters.`);
  if (input.targetUserId === user.id) throw new Error("You can't challenge yourself.");

  const prompt = input.prompt?.trim().slice(0, MAX_PROMPT_LENGTH) || null;
  const statement = input.statement?.trim().slice(0, MAX_STATEMENT_LENGTH) || null;

  const { data, error } = await supabase
    .from("duel_challenges")
    .insert({
      prompt,
      category_id: input.categoryId,
      challenger_id: user.id,
      challenger_label: label,
      challenger_statement: statement,
      target_user_id: input.targetUserId,
    })
    .select("id")
    .single();
  if (error) throw error;

  revalidatePath("/duels");
  return data.id as string;
}

/** Accept (with your own label/statement) or decline a pending challenge.
 * On accept, returns the id of the newly-created comparison; on decline,
 * returns null. Runs through the respond_to_duel_challenge RPC so an open
 * callout's "first claim wins" race is resolved atomically in the DB. */
export async function respondToDuelAction(
  challengeId: string,
  accept: boolean,
  optionLabel?: string,
  statement?: string
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("respond_to_duel_challenge", {
    p_challenge_id: challengeId,
    p_accept: accept,
    p_option_label: optionLabel,
    p_statement: statement,
  });
  if (error) throw error;

  revalidatePath("/duels");
  revalidatePath("/notifications");
  return data as string | null;
}
