-- Restrict comparison-images uploads to reasonable image files/sizes.
-- Previously the bucket had no file_size_limit/allowed_mime_types, so any
-- authenticated user could upload arbitrarily large or non-image files.
update storage.buckets
set file_size_limit = 8388608, -- 8 MiB
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
where id = 'comparison-images';
