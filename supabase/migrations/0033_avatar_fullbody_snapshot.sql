-- The single avatar_url snapshot was framed as a headshot (face + shoulders,
-- right for small circular avatars everywhere) but was also being reused for
-- the big vertical avatar block on the share card, where it read as
-- "face only" instead of the full standing figure. Splitting into two
-- purpose-specific renders instead of trying to make one image serve both:
-- avatar_url stays a headshot crop, avatar_fullbody_url is framed head-to-
-- feet for contexts that want to show the whole avatar.

alter table public.profiles
  add column avatar_fullbody_url text;

comment on column public.profiles.avatar_fullbody_url is
  'Full-body (head-to-feet) render of the 3D avatar, copied into our own Supabase Storage alongside avatar_model_url and the avatar_url headshot crop. Used where the whole figure should show (e.g. the share card), not just a small circular avatar.';
