-- Fun/authentic comparisons with real "debate energy" — dating preferences,
-- lifestyle/aesthetic takes, fandom rivalries, and neutral political-figure
-- polls — instead of only generic "biggest name" match-ups. Extends the
-- 0008 seed pattern with optional option_c..option_f so this batch can also
-- seed multi-way (3-6 option) comparisons now that up to 6 are supported.
create temporary table _seed_0056 (
  id uuid not null default gen_random_uuid(),
  category_slug text not null,
  prompt text,
  option_a text not null,
  option_b text not null,
  option_c text,
  option_d text,
  option_e text,
  option_f text
) on commit drop;

insert into _seed_0056 (category_slug, prompt, option_a, option_b, option_c, option_d, option_e, option_f) values
  ('life', null, 'Girls with braces', 'Girls with glasses', null, null, null, null),
  ('life', null, 'Guys who post on social media', 'Guys who don''t post at all', null, null, null, null),
  ('life', 'Who would you rather date?', 'Central Cee', 'Jude Bellingham', null, null, null, null),
  ('life', 'Neutral poll: who was the better president?', 'Donald Trump', 'Barack Obama', null, null, null, null),
  ('life', 'Which pays better long-term?', 'Music money', 'Football money', null, null, null, null),
  ('life', null, 'Texting all day', 'Calling instead', null, null, null, null),
  ('life', null, 'Big flashy wedding', 'Small intimate wedding', null, null, null, null),
  ('life', null, 'Dating an ex''s friend', 'Never speaking again', null, null, null, null),
  ('life', null, 'Being the funny friend', 'Being the reliable friend', null, null, null, null),
  ('life', null, 'Moving to a new city alone', 'Staying close to family', null, null, null, null),
  ('life', 'Who would you rather date?', 'Someone funny but broke', 'Someone rich but boring', null, null, null, null),
  ('life', null, 'Morning person', 'Night owl', null, null, null, null),
  ('life', null, 'Renting forever', 'Owning a small place', null, null, null, null),
  ('life', null, 'Loud personality', 'Quiet and mysterious', null, null, null, null),
  ('food', null, 'M&Ms', 'Skittles', null, null, null, null),
  ('sports', 'Squad depth: who actually has more?', 'Barcelona', 'Real Madrid', null, null, null, null),
  ('sports', null, 'Old-school Barça', 'New Barça', null, null, null, null),
  ('sports', null, 'Home crowd energy', 'Away day loyalty', null, null, null, null),
  ('music', null, 'Dave', 'Central Cee', null, null, null, null),
  ('music', 'Pick your favorite', 'Wizkid', 'Davido', 'Burna Boy', null, null, null),
  ('music', null, 'Concert mosh pit', 'VIP lounge seats', null, null, null, null),
  ('fashion', 'I have to choose an outfit — this or that?', 'All black fit', 'Bold color fit', null, null, null, null)
;

insert into public.comparisons (id, category_id, prompt, is_onboarding, status)
select s.id, c.id, s.prompt, false, 'active'
from _seed_0056 s
join public.categories c on c.slug = s.category_slug;

insert into public.comparison_options (comparison_id, side, label)
select id, 'a', option_a from _seed_0056
union all
select id, 'b', option_b from _seed_0056
union all
select id, 'c', option_c from _seed_0056 where option_c is not null
union all
select id, 'd', option_d from _seed_0056 where option_d is not null
union all
select id, 'e', option_e from _seed_0056 where option_e is not null
union all
select id, 'f', option_f from _seed_0056 where option_f is not null;
