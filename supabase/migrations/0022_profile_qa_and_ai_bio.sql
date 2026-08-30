-- Open-ended personal-details Q&A, privately stored per user, summarized by
-- AI into a fun public bio shown on the Share Card.
create table public.profile_answers (
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_key text not null,
  answer text not null check (char_length(answer) between 1 and 500),
  updated_at timestamptz not null default now(),
  primary key (user_id, question_key)
);

alter table public.profile_answers enable row level security;

create policy "users can view own profile answers"
  on public.profile_answers for select
  using (auth.uid() = user_id);

create policy "users can upsert own profile answers"
  on public.profile_answers for insert
  with check (auth.uid() = user_id);

create policy "users can update own profile answers"
  on public.profile_answers for update
  using (auth.uid() = user_id);

alter table public.profiles add column ai_bio text;
alter table public.profiles add column ai_bio_generated_at timestamptz;
