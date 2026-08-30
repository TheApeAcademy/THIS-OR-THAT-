-- Turn "this or that" into a way to learn something too: an optional
-- fun_fact revealed after voting, plus a dedicated Trivia & Facts category.
alter table public.comparisons add column fun_fact text check (fun_fact is null or char_length(fun_fact) <= 500);

insert into public.categories (slug, label, emoji, sort_order, is_active)
values ('trivia', 'Trivia & Facts', '🧠', 10, true);
