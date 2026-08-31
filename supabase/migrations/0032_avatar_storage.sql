-- Ready Player Me (the third-party avatar creator originally targeted here)
-- was acquired by Netflix and shut down on Jan 31 2026 -- see the reverted
-- commits in this repo's history. Avaturn replaces it as the avatar
-- creation UI, but this time we don't lean on a third party to host the
-- resulting files indefinitely: the exported .glb and a rendered PNG
-- snapshot are copied into our own storage the moment they're created, so
-- existing users' avatars keep working even if the creator vendor changes
-- again later. Bucket/policy shape follows 0007_comparison_images_storage.sql.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "public can view avatars"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "users can upload their own avatar files"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "users can overwrite their own avatar files"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

comment on column public.profiles.avatar_model_url is
  'Renderer-agnostic URL to the 3D avatar asset, always copied into our own Supabase Storage (avatars/{user_id}/model.glb) regardless of which creator produced it. Null until the user completes the 3D avatar builder.';
comment on column public.profiles.avatar_renderer is
  'Which creator produced the avatar before it was copied to our storage, e.g. ''avaturn''. Deliberately free text, not a CHECK constraint, so a future custom pipeline needs no migration.';
comment on column public.profiles.avatar_meta is
  'Small renderer-specific metadata blob, e.g. {"avaturnAvatarId": "...", "exportedAt": "..."}. Shape is renderer-defined and intentionally versionless.';
