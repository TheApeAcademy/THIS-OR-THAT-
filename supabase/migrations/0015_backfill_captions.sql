-- Backfill captions for comparisons seeded before the `caption` column
-- existed (migration 0008 predates 0013). Generates a varied, on-topic
-- caption — a short description of the matchup plus category hashtags —
-- for every comparison that still has caption is null.
with agg as (
  select
    c.id,
    cat.slug as category_slug,
    string_agg(co.label, ' vs ' order by co.side) as option_line,
    row_number() over (order by c.id) as rn
  from public.comparisons c
  join public.categories cat on cat.id = c.category_id
  join public.comparison_options co on co.comparison_id = c.id
  where c.caption is null
  group by c.id, cat.slug
),
templated as (
  select
    id,
    (array[
      option_line || ' — which one wins for you?',
      'Settle it once and for all: ' || option_line || '.',
      option_line || '. No in-between, pick a side.',
      'The debate everyone has an opinion on: ' || option_line || '.',
      option_line || ' — tell us where you stand.',
      'Two icons, one vote: ' || option_line || '.',
      option_line || '. Drop your pick and defend it.',
      'Every generation argues this one: ' || option_line || '.'
    ])[1 + (rn % 8)] as base,
    (array[
      case category_slug
        when 'music' then ' #music #musictwitter'
        when 'cars' then ' #cars #carculture'
        when 'fashion' then ' #fashion #style'
        when 'travel' then ' #travel #wanderlust'
        when 'technology' then ' #tech #gadgets'
        when 'food' then ' #food #foodie'
        when 'movies' then ' #movies #film'
        when 'sports' then ' #sports #sportstalk'
        when 'gaming' then ' #gaming #gamer'
        else ' #thisorthat'
      end,
      case category_slug
        when 'music' then ' #newmusic #playlist'
        when 'cars' then ' #cardebate #autos'
        when 'fashion' then ' #ootd #fashiontalk'
        when 'travel' then ' #traveltalk #bucketlist'
        when 'technology' then ' #techtalk #innovation'
        when 'food' then ' #foodtalk #cravings'
        when 'movies' then ' #cinema #moviedebate'
        when 'sports' then ' #sportsdebate #fandom'
        when 'gaming' then ' #gamerlife #gamingcommunity'
        else ' #pickaside'
      end,
      case category_slug
        when 'music' then ' #musiclovers'
        when 'cars' then ' #carsofinstagram'
        when 'fashion' then ' #styleinspo'
        when 'travel' then ' #traveltheworld'
        when 'technology' then ' #techlovers'
        when 'food' then ' #foodculture'
        when 'movies' then ' #filmtwitter'
        when 'sports' then ' #sportsfan'
        when 'gaming' then ' #gamingnews'
        else ' #vote'
      end
    ])[1 + (rn % 3)] as tags
  from agg
)
update public.comparisons c
set caption = left(t.base || t.tags, 280)
from templated t
where t.id = c.id;
