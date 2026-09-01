-- Track H: card content intelligence. Two independent additions:
-- (1) a percentile function over preference_dna.breakdown so the card can
--     say "more into Music than 88% of players" instead of a bare number;
-- (2) a monthly-snapshot history table so the card can show a trend delta
--     ("up 8pts since last month"), populated by a trigger that fires at
--     most once per rolling 30 days per user, no pg_cron needed.

create function public.get_dna_percentiles(p_user_id uuid)
returns table(slug text, percentile numeric, sample_size bigint)
language sql
stable
as $$
  with mine as (
    select e.key as slug, (e.value->>'pct')::numeric as pct
    from public.preference_dna pd, jsonb_each(pd.breakdown) as e
    where pd.user_id = p_user_id
  ),
  population as (
    select e.key as slug, (e.value->>'pct')::numeric as pct
    from public.preference_dna pd
    join public.profiles p on p.id = pd.user_id
    cross join lateral jsonb_each(pd.breakdown) as e
    where p.is_seed_account = false
  )
  select
    m.slug,
    round((
      select percent_rank(m.pct) within group (order by pop.pct) * 100
      from population pop
      where pop.slug = m.slug
    ))::numeric as percentile,
    (select count(*) from population pop where pop.slug = m.slug) as sample_size
  from mine m;
$$;

create table public.preference_dna_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  breakdown jsonb not null,
  captured_at timestamptz not null default now()
);

create index idx_preference_dna_history_user_captured on public.preference_dna_history (user_id, captured_at desc);

alter table public.preference_dna_history enable row level security;

create policy "dna history is publicly readable"
  on public.preference_dna_history for select
  using (true);
-- No insert policy: rows are written exclusively by the trigger below,
-- matching the notifications table's trigger-only convention.

create function public.handle_preference_dna_snapshot()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.preference_dna_history
    where user_id = new.user_id and captured_at > now() - interval '30 days'
  ) then
    insert into public.preference_dna_history (user_id, breakdown)
    values (new.user_id, new.breakdown);
  end if;
  return new;
end;
$$;

create trigger on_preference_dna_snapshot
  after insert or update on public.preference_dna
  for each row execute function public.handle_preference_dna_snapshot();

revoke execute on function public.handle_preference_dna_snapshot from anon, authenticated;
