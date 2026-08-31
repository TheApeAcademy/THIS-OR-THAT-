-- A real user-uploaded photo, separate from the 3D-avatar-rendered
-- headshot in avatar_url. Consumers prefer this when set, falling back to
-- the 3D headshot, then to initials (see components/ui/Avatar.tsx).
alter table public.profiles add column profile_photo_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', true, 8388608, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "public can view profile photos"
on storage.objects for select
using (bucket_id = 'profile-photos');

create policy "users can upload their own profile photo"
on storage.objects for insert
with check (
  bucket_id = 'profile-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "users can overwrite their own profile photo"
on storage.objects for update
using (
  bucket_id = 'profile-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'profile-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);
