-- Seed the Trivia & Facts category: real "this or that" questions where
-- voting reveals a fun_fact answer, turning a swipe into a tiny lesson.
create temporary table _seed_0019 (
  id uuid not null default gen_random_uuid(),
  prompt text not null,
  option_a text not null,
  option_b text not null,
  fun_fact text not null
) on commit drop;

insert into _seed_0019 (prompt, option_a, option_b, fun_fact) values
  ('Which is bigger?', 'Earth', 'Venus', 'Earth wins! Its diameter is about 12,742 km vs Venus''s 12,104 km — Venus is often called Earth''s twin but is actually a bit smaller.'),
  ('Which planet has more moons?', 'Saturn', 'Jupiter', 'Saturn takes the crown with 146 confirmed moons vs Jupiter''s 95 — Jupiter held the record until 2023, when a batch of tiny new Saturnian moons were confirmed.'),
  ('Which is hotter?', 'Venus', 'Mercury', 'Venus is hotter! Despite Mercury being closer to the Sun, Venus''s thick CO2 atmosphere traps heat, pushing its surface to about 465°C — hot enough to melt lead.'),
  ('Which is closer to Earth?', 'The Moon', 'The ISS', 'The ISS, by a mile — literally. It orbits about 400 km up, while the Moon is roughly 384,400 km away — nearly 1,000 times farther.'),
  ('Which has the shorter day?', 'Jupiter', 'Earth', 'Jupiter spins so fast its day is only about 10 hours — despite being over 11 times wider than Earth.'),
  ('Which planet is windier?', 'Neptune', 'Earth', 'Neptune has the fastest winds in the solar system — recorded gusts up to 2,100 km/h, more than 10x Earth''s strongest hurricanes.'),
  ('Which took longer to build?', 'The Great Wall of China', 'The Great Pyramid of Giza', 'The Great Wall, by far — construction and rebuilding spanned over 2,000 years across multiple dynasties, while the Great Pyramid was completed in roughly 20 years.'),
  ('Which is older?', 'Stonehenge', 'The Great Pyramid of Giza', 'Stonehenge — its earliest phase dates to around 3000 BCE, over 500 years before the Great Pyramid was completed around 2560 BCE.'),
  ('Which came first?', 'The Statue of Liberty', 'The Eiffel Tower', 'The Statue of Liberty, dedicated in 1886 — three years before the Eiffel Tower was completed in 1889.'),
  ('Which company is older?', 'Coca-Cola', 'Nintendo', 'Coca-Cola, just barely — invented in 1886, three years before Nintendo was founded in 1889 as a playing card company.'),
  ('Which was invented first?', 'The wheel', 'Writing', 'The wheel — usually dated to around 3500 BCE, a couple hundred years before the earliest writing systems appeared.'),
  ('Which country gets credit for the sandwich?', 'England', 'France', 'England — it''s named after John Montagu, the 4th Earl of Sandwich, in 18th-century England.'),
  ('Which happened first?', 'The Moon landing', 'The video game Pong', 'The Moon landing! Neil Armstrong walked on the Moon in July 1969 — three years before Pong was released in 1972.'),
  ('Which is older?', 'Email', 'The World Wide Web', 'Email — Ray Tomlinson sent the first network email in 1971, nearly two decades before Tim Berners-Lee proposed the World Wide Web in 1989.'),
  ('Which launched first?', 'Facebook', 'The iPhone', 'Facebook — it launched in February 2004, more than three years before the first iPhone in June 2007.'),
  ('Which lives longer?', 'A Greenland shark', 'A giant tortoise', 'The Greenland shark — some are estimated to live 300-400+ years, making them the longest-living vertebrate known, well past even the oldest tortoises.'),
  ('Which is faster?', 'A cheetah', 'A diving peregrine falcon', 'The peregrine falcon — in a hunting dive it can exceed 320 km/h, more than double a cheetah''s top land speed.'),
  ('Which sleeps more?', 'A koala', 'A human', 'The koala — they sleep 18 to 22 hours a day, more than double what an average human gets.'),
  ('Which has the better sense of smell?', 'A dog', 'An elephant', 'The elephant! Research has found elephants have roughly twice as many smell-related genes as dogs, giving them one of the most powerful noses in the animal kingdom.'),
  ('Which survives longer without water?', 'A camel', 'A human', 'The camel — it can go over a week without water, while a human typically lasts only 3-4 days.'),
  ('Which swims faster?', 'A dolphin', 'An Olympic swimmer', 'A dolphin — it can reach speeds around 30 km/h, more than three times faster than even elite human swimmers.'),
  ('Which weighs about the same as the other?', 'A blue whale''s tongue', 'An African elephant', 'They''re surprisingly close — a blue whale''s tongue can weigh around 2.7 tonnes, in the same ballpark as an adult African elephant.'),
  ('Which has more bones?', 'A human baby', 'A human adult', 'A baby! Babies are born with about 300 bones, but many fuse together as they grow, leaving adults with just 206.'),
  ('Which organ is heavier?', 'The liver', 'The brain', 'The liver — at around 1.5 kg it''s typically the heaviest internal organ, edging out the brain''s roughly 1.3-1.4 kg.'),
  ('Which uses more of your energy at rest?', 'Your brain', 'Your heart', 'Your brain — despite being about 2% of your body weight, it burns roughly 20% of your energy at rest.'),
  ('Which makes up more of your body weight?', 'Water', 'Protein', 'Water — it makes up about 60% of an adult''s body weight, far more than protein''s roughly 16-20%.'),
  ('Which is harder?', 'A diamond', 'Tooth enamel', 'A diamond, by a wide margin — it ranks 10 on the Mohs hardness scale, while enamel (the hardest substance in your body) ranks around 5.'),
  ('Which blood type is more common worldwide?', 'Type O', 'Type AB', 'Type O — it''s the most common blood type globally, while type AB is the rarest.'),
  ('Which desert is bigger?', 'Antarctica', 'The Sahara', 'Antarctica! By the technical definition of a desert (low precipitation), the icy continent is actually the largest desert on Earth.'),
  ('Which ocean is bigger?', 'The Pacific', 'The Atlantic', 'The Pacific — it''s the largest ocean on Earth, covering more area than all the continents combined.'),
  ('Which country has more time zones?', 'France', 'Russia', 'France — thanks to its overseas territories, it spans 12 time zones, one more than Russia''s 11, despite Russia being the world''s largest country by area.'),
  ('Which metro area has more people?', 'Tokyo', 'New York City', 'Tokyo — its greater metropolitan area is home to roughly 37 million people, nearly double New York City''s metro population.'),
  ('Which country is bigger by land area?', 'Russia', 'Canada', 'Russia — at about 17 million km² it''s nearly double the size of Canada, the world''s second-largest country.'),
  ('Which country has more pyramids?', 'Sudan', 'Egypt', 'Sudan! It''s home to over 200 ancient Nubian pyramids — more than Egypt''s roughly 120-140.'),
  ('Which country has the most active volcanoes?', 'Indonesia', 'The USA', 'Indonesia — it''s home to around 130 active volcanoes, more than any other country on Earth.'),
  ('Which country has more islands?', 'Sweden', 'Indonesia', 'Sweden — government surveys count over 267,000 islands, far more than Indonesia''s roughly 17,000.'),
  ('Which country has more natural lakes?', 'Canada', 'Russia', 'Canada — it''s home to more freshwater lakes than the rest of the world combined, by some counts.'),
  ('Which continent has more countries?', 'Africa', 'Asia', 'Africa — with 54 recognized countries, it has more than any other continent, including Asia''s 48.'),
  ('Which language has more native speakers?', 'Mandarin Chinese', 'Spanish', 'Mandarin Chinese — with roughly 940 million native speakers, it far outnumbers Spanish''s approximately 485 million.'),
  ('Which travels faster?', 'Light', 'Sound', 'Light, by an enormous margin — it travels at about 300,000 km/s, over 800,000 times faster than sound''s roughly 343 m/s.'),
  ('Which conducts electricity better?', 'Silver', 'Copper', 'Silver — it''s actually the best electrical conductor of any metal, though copper is used more often because it''s far cheaper.'),
  ('Which is more abundant in Earth''s atmosphere?', 'Nitrogen', 'Oxygen', 'Nitrogen — it makes up about 78% of the atmosphere, compared to oxygen''s roughly 21%.'),
  ('Which is smaller?', 'An atom', 'A virus', 'An atom — viruses are built from many atoms and molecules, so they''re actually much larger than a single atom.'),
  ('Which has more chromosomes?', 'A potato', 'A human', 'The potato! It has 48 chromosomes to a human''s 46, since potatoes are tetraploid — a genuinely surprising fact.'),
  ('Which weighs more?', '1 kg of feathers', '1 kg of steel', 'Trick question — they weigh exactly the same! A kilogram is a kilogram; steel is just far denser, so it takes up much less space.'),
  ('Which pepper is spicier?', 'Habanero', 'Jalapeño', 'The habanero, by a lot — it can hit 350,000 Scoville units, compared to a jalapeño''s roughly 2,500-8,000.'),
  ('Which has more caffeine per cup?', 'Coffee', 'Black tea', 'Coffee — a typical cup has around 95 mg of caffeine, compared to black tea''s roughly 40-70 mg.'),
  ('Which country produces more coffee?', 'Brazil', 'Colombia', 'Brazil — it''s been the world''s largest coffee producer for over 150 years, growing roughly a third of the global supply.'),
  ('Which country drinks more tea per person?', 'Turkey', 'The UK', 'Turkey — it consistently ranks among the highest tea consumers per capita in the world, ahead of the UK.'),
  ('Which lasts longer in storage?', 'Honey', 'Milk', 'Honey, easily — it essentially never spoils. Archaeologists have found perfectly edible honey in ancient Egyptian tombs thousands of years old.'),
  ('Which country is credited with inventing modern pizza?', 'Italy', 'The USA', 'Italy — the tomato-topped pizza we know today originated in Naples in the late 1800s.'),
  ('Which has more hearts?', 'An octopus', 'A human', 'The octopus — it has three hearts: two pump blood to the gills, and one pumps it to the rest of the body.'),
  ('Which has the stronger bite?', 'A saltwater crocodile', 'A lion', 'The saltwater crocodile — its bite force has been measured at around 3,700 psi, nearly six times stronger than a lion''s roughly 650 psi.'),
  ('Which sees better in the dark?', 'A cat', 'A human', 'A cat, easily — more light-sensing rod cells and a reflective layer behind the retina let cats see in light six times dimmer than what humans need.'),
  ('Which is relatively stronger for its size?', 'An ant', 'An elephant', 'The ant — pound for pound, some ants can carry up to 50 times their own body weight, far outperforming an elephant relative to its size.'),
  ('Which one lays eggs?', 'A platypus', 'A kangaroo', 'The platypus! It''s one of only a handful of egg-laying mammals on Earth, a group called monotremes.'),
  ('Which country has more people, as of 2023?', 'India', 'China', 'India — UN estimates show India overtook China in 2023 to become the world''s most populous country.'),
  ('What does a camel''s hump actually store?', 'Fat', 'Water', 'Fat! It''s a common myth that humps store water — camels actually store fatty tissue there, which they metabolize for energy and water during long desert treks.'),
  ('Which migrates farther each year?', 'Arctic tern', 'Monarch butterfly', 'The Arctic tern, by a huge margin — its round-trip migration covers up to 70,000 km a year, compared to a monarch''s roughly 4,000-4,800 km one way.'),
  ('Which came first historically?', 'Coffee as a drink', 'Tea as a drink', 'Tea — its documented use in China dates back thousands of years, well before coffee''s discovery in Ethiopia around the 9th century CE.')
;

insert into public.comparisons (id, category_id, prompt, caption, fun_fact, is_onboarding, status)
select
  s.id,
  c.id,
  s.prompt,
  (array[
    'Test your knowledge! 🧠 #trivia #didyouknow',
    'Vote, then see the answer. #funfacts #trivia',
    'How well do you actually know this? #didyouknow #learnsomething',
    'Guess first, then find out. #trivia #factoftheday'
  ])[1 + (row_number() over (order by s.id) % 4)],
  s.fun_fact,
  false,
  'active'
from _seed_0019 s
join public.categories c on c.slug = 'trivia';

insert into public.comparison_options (comparison_id, side, label)
select id, 'a', option_a from _seed_0019
union all
select id, 'b', option_b from _seed_0019;
