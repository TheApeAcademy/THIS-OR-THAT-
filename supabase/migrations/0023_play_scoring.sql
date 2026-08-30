-- Play mode scoring: tag trivia comparisons with a subject + the correct
-- option side, then log answers and roll them up into per-subject stats
-- for leaderboards.
alter table public.comparisons add column subject text;
alter table public.comparisons add column correct_side text check (correct_side is null or correct_side in ('a', 'b', 'c', 'd'));

with mapping (prompt, option_a_label, subject, correct_side) as (
  values
    ('Which is bigger?', 'Earth', 'space', 'a'),
    ('Which planet has more moons?', 'Saturn', 'space', 'a'),
    ('Which is hotter?', 'Venus', 'space', 'a'),
    ('Which is closer to Earth?', 'The Moon', 'space', 'b'),
    ('Which has the shorter day?', 'Jupiter', 'space', 'a'),
    ('Which planet is windier?', 'Neptune', 'space', 'a'),
    ('Which took longer to build?', 'The Great Wall of China', 'history', 'a'),
    ('Which is older?', 'Stonehenge', 'history', 'a'),
    ('Which came first?', 'The Statue of Liberty', 'history', 'a'),
    ('Which company is older?', 'Coca-Cola', 'history', 'a'),
    ('Which was invented first?', 'The wheel', 'history', 'a'),
    ('Which country gets credit for the sandwich?', 'England', 'history', 'a'),
    ('Which happened first?', 'The Moon landing', 'history', 'a'),
    ('Which is older?', 'Email', 'history', 'a'),
    ('Which launched first?', 'Facebook', 'history', 'a'),
    ('Which lives longer?', 'A Greenland shark', 'animals', 'a'),
    ('Which is faster?', 'A cheetah', 'animals', 'b'),
    ('Which sleeps more?', 'A koala', 'animals', 'a'),
    ('Which has the better sense of smell?', 'A dog', 'animals', 'b'),
    ('Which survives longer without water?', 'A camel', 'animals', 'a'),
    ('Which swims faster?', 'A dolphin', 'animals', 'a'),
    ('Which weighs about the same as the other?', 'A blue whale''s tongue', 'animals', null),
    ('Which has more bones?', 'A human baby', 'human-body', 'a'),
    ('Which organ is heavier?', 'The liver', 'human-body', 'a'),
    ('Which uses more of your energy at rest?', 'Your brain', 'human-body', 'a'),
    ('Which makes up more of your body weight?', 'Water', 'human-body', 'a'),
    ('Which is harder?', 'A diamond', 'human-body', 'a'),
    ('Which blood type is more common worldwide?', 'Type O', 'human-body', 'a'),
    ('Which desert is bigger?', 'Antarctica', 'geography', 'a'),
    ('Which ocean is bigger?', 'The Pacific', 'geography', 'a'),
    ('Which country has more time zones?', 'France', 'geography', 'a'),
    ('Which metro area has more people?', 'Tokyo', 'geography', 'a'),
    ('Which country is bigger by land area?', 'Russia', 'geography', 'a'),
    ('Which country has more pyramids?', 'Sudan', 'geography', 'a'),
    ('Which country has the most active volcanoes?', 'Indonesia', 'geography', 'a'),
    ('Which country has more islands?', 'Sweden', 'geography', 'a'),
    ('Which country has more natural lakes?', 'Canada', 'geography', 'a'),
    ('Which continent has more countries?', 'Africa', 'geography', 'a'),
    ('Which language has more native speakers?', 'Mandarin Chinese', 'geography', 'a'),
    ('Which travels faster?', 'Light', 'science', 'a'),
    ('Which conducts electricity better?', 'Silver', 'science', 'a'),
    ('Which is more abundant in Earth''s atmosphere?', 'Nitrogen', 'science', 'a'),
    ('Which is smaller?', 'An atom', 'science', 'a'),
    ('Which has more chromosomes?', 'A potato', 'science', 'a'),
    ('Which weighs more?', '1 kg of feathers', 'science', null),
    ('Which pepper is spicier?', 'Habanero', 'food', 'a'),
    ('Which has more caffeine per cup?', 'Coffee', 'food', 'a'),
    ('Which country produces more coffee?', 'Brazil', 'food', 'a'),
    ('Which country drinks more tea per person?', 'Turkey', 'food', 'a'),
    ('Which lasts longer in storage?', 'Honey', 'food', 'a'),
    ('Which country is credited with inventing modern pizza?', 'Italy', 'food', 'a'),
    ('Which has more hearts?', 'An octopus', 'animals', 'a'),
    ('Which has the stronger bite?', 'A saltwater crocodile', 'animals', 'a'),
    ('Which sees better in the dark?', 'A cat', 'animals', 'a'),
    ('Which is relatively stronger for its size?', 'An ant', 'animals', 'a'),
    ('Which one lays eggs?', 'A platypus', 'animals', 'a'),
    ('Which country has more people, as of 2023?', 'India', 'geography', 'a'),
    ('What does a camel''s hump actually store?', 'Fat', 'animals', 'a'),
    ('Which migrates farther each year?', 'Arctic tern', 'animals', 'a'),
    ('Which came first historically?', 'Coffee as a drink', 'food', 'b')
),
matched as (
  select c2.id as comparison_id, m.subject, m.correct_side
  from mapping m
  join public.comparison_options co on co.side = 'a' and co.label = m.option_a_label
  join public.comparisons c2 on c2.id = co.comparison_id and c2.prompt = m.prompt
  where c2.category_id = (select id from public.categories where slug = 'trivia')
)
update public.comparisons c
set subject = matched.subject,
    correct_side = matched.correct_side
from matched
where c.id = matched.comparison_id;

-- Per-answer log (for auditing/streaks-style features later) plus a rolled-up
-- per-subject stats row per user, used to render leaderboards cheaply.
create table public.play_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  comparison_id uuid not null references public.comparisons(id) on delete cascade,
  subject text not null,
  correct boolean,
  created_at timestamptz not null default now()
);

alter table public.play_answers enable row level security;

create policy "users can view own play answers"
  on public.play_answers for select
  using (auth.uid() = user_id);

create policy "users can insert own play answers"
  on public.play_answers for insert
  with check (auth.uid() = user_id);

create index idx_play_answers_user on public.play_answers (user_id);

create table public.play_stats (
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  correct int not null default 0,
  total int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, subject)
);

alter table public.play_stats enable row level security;

create policy "play stats are publicly readable"
  on public.play_stats for select
  using (true);

create policy "users can upsert own play stats"
  on public.play_stats for insert
  with check (auth.uid() = user_id);

create policy "users can update own play stats"
  on public.play_stats for update
  using (auth.uid() = user_id);

-- Records one graded (or ungraded, correct=null) trivia answer: logs it and
-- rolls it into that user's per-subject running total. Callable by the
-- answering user only.
create function public.record_play_answer(
  p_comparison_id uuid,
  p_subject text,
  p_correct boolean
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.play_answers (user_id, comparison_id, subject, correct)
  values (v_user_id, p_comparison_id, p_subject, p_correct);

  if p_correct is not null then
    insert into public.play_stats (user_id, subject, correct, total)
    values (v_user_id, p_subject, case when p_correct then 1 else 0 end, 1)
    on conflict (user_id, subject)
    do update set
      correct = public.play_stats.correct + case when p_correct then 1 else 0 end,
      total = public.play_stats.total + 1,
      updated_at = now();
  end if;

  perform public.bump_streak(v_user_id);
end;
$$;
