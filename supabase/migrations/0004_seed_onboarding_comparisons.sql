-- Seed the ~30-60 onboarding comparisons used to build a new user's
-- initial Preference DNA, spread across every category.
do $$
declare
  v_category_id uuid;
  v_comparison_id uuid;
  rec record;
begin
  for rec in
    select * from (values
      ('music', 'Drake', 'Kendrick'),
      ('music', 'R&B', 'Afrobeats'),
      ('music', 'Old school', 'New school'),
      ('music', 'Vinyl', 'Streaming'),
      ('cars', 'BMW', 'Mercedes'),
      ('cars', 'Sports car', 'SUV'),
      ('cars', 'Petrol', 'Electric'),
      ('cars', 'Manual', 'Automatic'),
      ('fashion', 'Nike', 'Adidas'),
      ('fashion', 'Streetwear', 'Formal'),
      ('fashion', 'Sneakers', 'Boots'),
      ('fashion', 'Minimalist', 'Bold'),
      ('travel', 'Barcelona', 'Miami'),
      ('travel', 'Beach', 'City'),
      ('travel', 'Luxury', 'Budget'),
      ('travel', 'Mountains', 'Ocean'),
      ('gaming', 'PlayStation', 'Xbox'),
      ('gaming', 'PC', 'Console'),
      ('gaming', 'Single-player', 'Multiplayer'),
      ('gaming', 'Mobile', 'Handheld'),
      ('sports', 'Messi', 'Ronaldo'),
      ('sports', 'Football', 'Basketball'),
      ('sports', 'Watching live', 'Watching on TV'),
      ('sports', 'Team sport', 'Individual sport'),
      ('food', 'Pizza', 'Burger'),
      ('food', 'Spicy', 'Mild'),
      ('food', 'Home cooked', 'Takeout'),
      ('food', 'Sweet', 'Savory'),
      ('movies', 'Marvel', 'DC'),
      ('movies', 'Cinema', 'Streaming at home'),
      ('movies', 'Comedy', 'Drama'),
      ('movies', 'Sequel', 'Original'),
      ('technology', 'iPhone', 'Samsung'),
      ('technology', 'Mac', 'Windows'),
      ('technology', 'Wired', 'Wireless'),
      ('technology', 'AI', 'Traditional software')
    ) as t(category_slug, option_a, option_b)
  loop
    select id into v_category_id from public.categories where slug = rec.category_slug;

    insert into public.comparisons (category_id, is_onboarding, status)
    values (v_category_id, true, 'active')
    returning id into v_comparison_id;

    insert into public.comparison_options (comparison_id, side, label)
    values
      (v_comparison_id, 'a', rec.option_a),
      (v_comparison_id, 'b', rec.option_b);
  end loop;
end $$;
