-- New category for the authentic/human-interest prompts that don't fit
-- neatly under the existing topic categories: dating preferences, lifestyle
-- takes, and neutral political-figure polls.
insert into public.categories (slug, label, emoji, sort_order, is_active)
values ('life', 'Life & Culture', '💬', 11, true)
on conflict (slug) do nothing;
