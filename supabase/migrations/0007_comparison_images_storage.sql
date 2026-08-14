-- Public bucket for user-uploaded comparison option images.
insert into storage.buckets (id, name, public)
values ('comparison-images', 'comparison-images', true)
on conflict (id) do nothing;

create policy "public can view comparison images"
on storage.objects for select
using (bucket_id = 'comparison-images');

create policy "authenticated users can upload comparison images to their own folder"
on storage.objects for insert
with check (
  bucket_id = 'comparison-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);
