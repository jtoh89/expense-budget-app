-- Seed categories and subcategories per the budget planner structure
-- Run after categories and subcategories tables exist
-- Subcategories are created for year 2026; duplicate for other years as needed

-- Categories (id, name)
insert into public.categories (id, name) values
  ('cat_future', 'Future'),
  ('cat_fixed', 'Fixed'),
  ('cat_flexible', 'Flexible'),
  ('cat_luxury', 'Luxury'),
  ('cat_pretax', 'Pretax'),
  ('cat_investments', 'Investments')
on conflict (id) do update set name = excluded.name;

-- Subcategories (id, name, category_id, year, monthly_budget)
-- Future
insert into public.subcategories (id, name, category_id, year, monthly_budget) values
  ('sub_wedding', 'Wedding', 'cat_future', 2026, 0),
  ('sub_car', 'Car', 'cat_future', 2026, 0)
on conflict (id) do update set name = excluded.name, category_id = excluded.category_id, year = excluded.year;

-- Fixed
insert into public.subcategories (id, name, category_id, year, monthly_budget) values
  ('sub_mortgage', 'Mortgage', 'cat_fixed', 2026, 0),
  ('sub_rent', 'Rent (if don''t own)', 'cat_fixed', 2026, 0),
  ('sub_utilities', 'Utilities', 'cat_fixed', 2026, 0),
  ('sub_internet', 'Internet', 'cat_fixed', 2026, 0),
  ('sub_cell_phone', 'Cell Phone', 'cat_fixed', 2026, 0),
  ('sub_whole_life', 'Whole Life Insurance', 'cat_fixed', 2026, 0),
  ('sub_disability', 'Disability Insurance', 'cat_fixed', 2026, 0),
  ('sub_health_insurance', 'Health insurance', 'cat_fixed', 2026, 0),
  ('sub_car_payment', 'Car Payment', 'cat_fixed', 2026, 0),
  ('sub_car_insurance', 'Car Insurance', 'cat_fixed', 2026, 0),
  ('sub_tuition', 'Tuition', 'cat_fixed', 2026, 0),
  ('sub_subscription', 'Subscription', 'cat_fixed', 2026, 0)
on conflict (id) do update set name = excluded.name, category_id = excluded.category_id, year = excluded.year;

-- Flexible
insert into public.subcategories (id, name, category_id, year, monthly_budget) values
  ('sub_groceries', 'Groceries', 'cat_flexible', 2026, 0),
  ('sub_dining_out', 'Dining Out', 'cat_flexible', 2026, 0),
  ('sub_home_supplies', 'Home Supplies', 'cat_flexible', 2026, 0),
  ('sub_gas', 'Gas', 'cat_flexible', 2026, 0),
  ('sub_shopping', 'Shopping', 'cat_flexible', 2026, 0),
  ('sub_beauty', 'Beauty', 'cat_flexible', 2026, 0),
  ('sub_pet_care', 'Pet Care', 'cat_flexible', 2026, 0),
  ('sub_entertainment', 'Entertainment', 'cat_flexible', 2026, 0),
  ('sub_charity', 'Charity/Donations', 'cat_flexible', 2026, 0),
  ('sub_miscellaneous', 'Miscellaneous', 'cat_flexible', 2026, 0),
  ('sub_rentals', 'Rentals', 'cat_flexible', 2026, 0),
  ('sub_business', 'Business/Side-Hustle', 'cat_flexible', 2026, 0)
on conflict (id) do update set name = excluded.name, category_id = excluded.category_id, year = excluded.year;

-- Luxury
insert into public.subcategories (id, name, category_id, year, monthly_budget) values
  ('sub_travel', 'Travel', 'cat_luxury', 2026, 0),
  ('sub_gifts', 'Gifts', 'cat_luxury', 2026, 0)
on conflict (id) do update set name = excluded.name, category_id = excluded.category_id, year = excluded.year;

-- Pretax
insert into public.subcategories (id, name, category_id, year, monthly_budget) values
  ('sub_401k', 'Invest in 401k/403b', 'cat_pretax', 2026, 0),
  ('sub_457b', 'Invest in 457b', 'cat_pretax', 2026, 0),
  ('sub_hsa_fsa', 'HSA/FSA', 'cat_pretax', 2026, 0),
  ('sub_sfgh_pension', 'SFGH Pension (9.5%)', 'cat_pretax', 2026, 0)
on conflict (id) do update set name = excluded.name, category_id = excluded.category_id, year = excluded.year;

-- Investments
insert into public.subcategories (id, name, category_id, year, monthly_budget) values
  ('sub_roth_ira', 'Roth IRA', 'cat_investments', 2026, 0),
  ('sub_stocks', 'Invest into stocks', 'cat_investments', 2026, 0),
  ('sub_real_estate', 'Invest in real estate', 'cat_investments', 2026, 0),
  ('sub_misc_investments', 'Misc Investments', 'cat_investments', 2026, 0)
on conflict (id) do update set name = excluded.name, category_id = excluded.category_id, year = excluded.year;
