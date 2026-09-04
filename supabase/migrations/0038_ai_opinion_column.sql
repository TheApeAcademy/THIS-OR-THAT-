-- Phase 6: cache column for the per-comparison AI opinion (also doubles
-- as the "biggest reasons behind each side" comment-theme summary) —
-- generated lazily by the new debate-ai-opinion edge function once a
-- comparison has enough activity to be worth summarizing.
alter table public.comparisons add column ai_opinion text;
alter table public.comparisons add column ai_opinion_generated_at timestamptz;
