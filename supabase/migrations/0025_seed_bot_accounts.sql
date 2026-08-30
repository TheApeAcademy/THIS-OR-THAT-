-- Seed placeholder accounts to attribute catalog content to (so the feed
-- shows a real-looking pfp + username on every post, TikTok-style) before
-- there's a real user base. Not surfaced as "bots" in the UI.
alter table public.profiles add column is_seed_account boolean not null default false;

with meta (email, username, display_name, bio) as (
  values
    ('seed.amara@seed.thisorthat.internal', 'amara_v', 'Amara', 'Music, food, and strong opinions.'),
    ('seed.kdramakay@seed.thisorthat.internal', 'kdrama_kay', 'Kay', 'K-dramas and iced coffee, always.'),
    ('seed.lagoshoops@seed.thisorthat.internal', 'lagos_hoops', 'Tobi', 'Basketball > everything. Lagos.'),
    ('seed.tokyotea@seed.thisorthat.internal', 'tokyo_tea', 'Yuki', 'Anime, ramen, and night walks.'),
    ('seed.mobeats@seed.thisorthat.internal', 'mo_beats', 'Mo', 'Producer. Beats first, sleep later.'),
    ('seed.rikojpg@seed.thisorthat.internal', 'riko.jpg', 'Riko', 'Street style and film photography.'),
    ('seed.zaraadeyemi@seed.thisorthat.internal', 'zaraadeyemi', 'Zara', 'Lawyer by day, foodie always.'),
    ('seed.jozijay@seed.thisorthat.internal', 'jozi_jay', 'Jay', 'Joburg raised. Cars and sneakers.'),
    ('seed.nnamdi@seed.thisorthat.internal', '_nnamdi', 'Nnamdi', 'Afrobeats and football arguments.'),
    ('seed.dreacodes@seed.thisorthat.internal', 'drea.codes', 'Andrea', 'Software engineer, coffee addict.'),
    ('seed.bennyriffs@seed.thisorthat.internal', 'benny_riffs', 'Benny', 'Guitar, vinyl, and 90s rock.'),
    ('seed.thandiwem@seed.thisorthat.internal', 'thandiwe_m', 'Thandiwe', 'Travel obsessed. Next stop: everywhere.'),
    ('seed.obiwank@seed.thisorthat.internal', 'obi.wan.k', 'Obi', 'Gamer. PC master race.'),
    ('seed.sadeoluwa@seed.thisorthat.internal', 'sadeoluwa', 'Sade', 'Fashion, gele, and good jollof.'),
    ('seed.mumbaimanny@seed.thisorthat.internal', 'mumbai_manny', 'Manny', 'Bollywood soundtracks on repeat.'),
    ('seed.priyasnaps@seed.thisorthat.internal', 'priya.snaps', 'Priya', 'Photographer. Chasing golden hour.'),
    ('seed.carlosverde@seed.thisorthat.internal', 'carlos_verde', 'Carlos', 'Football, tacos, and road trips.'),
    ('seed.sofiadances@seed.thisorthat.internal', 'sofia.dances', 'Sofia', 'Dance major. Reggaeton forever.'),
    ('seed.adegamer@seed.thisorthat.internal', 'ade_the_gamer', 'Ade', 'Speedrunner in training.'),
    ('seed.walewired@seed.thisorthat.internal', 'wale.wired', 'Wale', 'Tech reviews and gadget hoarding.'),
    ('seed.ngozireads@seed.thisorthat.internal', 'ngozi_reads', 'Ngozi', 'Books, movies, and hot takes.'),
    ('seed.femidrives@seed.thisorthat.internal', 'femi.drives', 'Femi', 'Car meets every weekend.'),
    ('seed.chiomavibes@seed.thisorthat.internal', 'ChiomaVibes', 'Chioma', 'Amapiano and good vibes only.'),
    ('seed.dubaidre@seed.thisorthat.internal', 'dubai_dre', 'Dre', 'Luxury watches and desert drives.'),
    ('seed.blessingb@seed.thisorthat.internal', 'blessing.b', 'Blessing', 'Skincare routine longer than my résumé.'),
    ('seed.tundefc@seed.thisorthat.internal', 'tunde_fc', 'Tunde', 'Arsenal till I die.'),
    ('seed.kwamecodes@seed.thisorthat.internal', 'kwame.codes', 'Kwame', 'Building things, breaking things.'),
    ('seed.amakastyle@seed.thisorthat.internal', 'amaka.style', 'Amaka', 'Thrift flips and streetwear.'),
    ('seed.jordanpicks@seed.thisorthat.internal', 'jordanpicks', 'Jordan', 'Sneakerhead. Retro Js only.'),
    ('seed.nairobinia@seed.thisorthat.internal', 'nairobi_nia', 'Nia', 'Safari guide. Nature over everything.'),
    ('seed.cairocee@seed.thisorthat.internal', 'cairo.cee', 'Cee', 'History nerd, trivia champion.'),
    ('seed.accraama@seed.thisorthat.internal', 'accra_ama', 'Ama', 'Highlife and jollof debates.'),
    ('seed.capetownkai@seed.thisorthat.internal', 'capetown_kai', 'Kai', 'Surfing before sunrise.'),
    ('seed.seoulsana@seed.thisorthat.internal', 'seoul_sana', 'Sana', 'K-pop stan account, unofficially.'),
    ('seed.manilamika@seed.thisorthat.internal', 'manila_mika', 'Mika', 'Karaoke queen. Adobo defender.'),
    ('seed.buenosairesbea@seed.thisorthat.internal', 'buenosaires_bea', 'Bea', 'Tango on weekends, mate always.'),
    ('seed.saopaulosam@seed.thisorthat.internal', 'saopaulo_sam', 'Sam', 'Football, samba, and sun.'),
    ('seed.delhidev@seed.thisorthat.internal', 'delhi_dev', 'Dev', 'Cricket stats and street food.'),
    ('seed.istanbulilay@seed.thisorthat.internal', 'istanbul_ilay', 'Ilay', 'Tea over coffee, always.'),
    ('seed.jakartajoy@seed.thisorthat.internal', 'jakarta_joy', 'Joy', 'Motorbikes and night markets.')
),
created as (
  insert into auth.users (
    instance_id, id, aud, role, email, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change
  )
  select
    '00000000-0000-0000-0000-000000000000'::uuid,
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    m.email,
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('username', m.username),
    '',
    '',
    '',
    ''
  from meta m
  returning id, email
)
update public.profiles p
set display_name = m.display_name,
    bio = m.bio,
    is_seed_account = true
from created c
join meta m on m.email = c.email
where p.id = c.id;
