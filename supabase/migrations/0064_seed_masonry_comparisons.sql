-- Multi-option (3-6) comparisons were technically supported since 0054 but
-- almost never appeared in a real feed session — only one 3-way comparison
-- existed in the whole seed set. This batch adds a real spread across every
-- option count (3/4/5/6) and several categories so the Pinterest-style
-- masonry layouts in lib/tileLayout.ts are a regular sight, not a fluke.
-- Same _seed_XXXX temp-table pattern as 0056.
create temporary table _seed_0064 (
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

insert into _seed_0064 (category_slug, prompt, option_a, option_b, option_c, option_d, option_e, option_f) values
  -- 3-way
  ('music', 'Pick your favorite', 'Drake', 'Kendrick Lamar', 'J. Cole', null, null, null),
  ('sports', 'Greatest of all time', 'Messi', 'Ronaldo', 'Pele', null, null, null),
  ('food', 'Pick your poison', 'Pizza', 'Sushi', 'Tacos', null, null, null),
  ('movies', 'Best trilogy', 'Lord of the Rings', 'The Dark Knight', 'The Matrix', null, null, null),
  -- 4-way
  ('sports', 'GOAT footballer', 'Messi', 'Ronaldo', 'Maradona', 'Pele', null, null),
  ('technology', 'Which streaming service wins?', 'Netflix', 'Disney+', 'Prime Video', 'HBO Max', null, null),
  ('technology', 'Best phone brand', 'iPhone', 'Samsung', 'Google Pixel', 'OnePlus', null, null),
  ('gaming', 'Best console this gen', 'PS5', 'Xbox Series X', 'Nintendo Switch', 'Gaming PC', null, null),
  ('music', 'Best decade for music', '90s', '2000s', '2010s', '2020s', null, null),
  -- 5-way
  ('food', 'Best comfort food', 'Fried chicken', 'Mac and cheese', 'Ramen', 'Burgers', 'Pasta', null),
  ('travel', 'Dream vacation type', 'Beach', 'Mountains', 'City break', 'Road trip', 'Safari', null),
  ('movies', 'Best movie genre', 'Action', 'Comedy', 'Horror', 'Romance', 'Sci-fi', null),
  -- 6-way
  ('travel', 'Bucket-list destination', 'Japan', 'Italy', 'Bali', 'Iceland', 'Brazil', 'Greece'),
  ('cars', 'Dream car brand', 'Ferrari', 'Lamborghini', 'Porsche', 'BMW', 'Tesla', 'Mercedes'),
  ('gaming', 'Best video game ever', 'GTA V', 'Minecraft', 'Fortnite', 'Zelda', 'FIFA', 'Call of Duty')
;

insert into public.comparisons (id, category_id, prompt, is_onboarding, status)
select s.id, c.id, s.prompt, false, 'active'
from _seed_0064 s
join public.categories c on c.slug = s.category_slug;

insert into public.comparison_options (comparison_id, side, label)
select id, 'a', option_a from _seed_0064
union all
select id, 'b', option_b from _seed_0064
union all
select id, 'c', option_c from _seed_0064 where option_c is not null
union all
select id, 'd', option_d from _seed_0064 where option_d is not null
union all
select id, 'e', option_e from _seed_0064 where option_e is not null
union all
select id, 'f', option_f from _seed_0064 where option_f is not null;
