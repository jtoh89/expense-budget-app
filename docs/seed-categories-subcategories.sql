-- Seed categories and subcategories per the budget planner structure
-- Run after categories and subcategories tables exist
-- Category ids match budget section names for AddBudgetItemModal filtering

-- Categories (id, name) - all budget sections
insert into public.categories (id, name) values
  ('Pretax', 'Pretax'),
  ('Investments', 'Investments'),
  ('Future', 'Future'),
  ('Fixed', 'Fixed'),
  ('Flexible', 'Flexible'),
  ('Luxury', 'Luxury')
on conflict (id) do update set name = excluded.name;

-- Subcategories (id, name, category_id) - IDs match budget page subcategoryId
-- Pretax
insert into public.subcategories (id, name, category_id) values
  ('401k_403b', 'Invest in 401k/403b', 'Pretax'),
  ('457b', 'Invest in 457b', 'Pretax'),
  ('hsa_fsa', 'HSA/FSA', 'Pretax'),
  ('pension', 'SFGH Pension (9.5%)', 'Pretax')
on conflict (id) do update set name = excluded.name, category_id = excluded.category_id;

-- Investments
insert into public.subcategories (id, name, category_id) values
  ('roth_ira', 'Roth IRA', 'Investments'),
  ('stocks', 'Invest into stocks', 'Investments'),
  ('real_estate', 'Invest in real estate', 'Investments'),
  ('misc_investments', 'Misc Investments', 'Investments')
on conflict (id) do update set name = excluded.name, category_id = excluded.category_id;

-- Future
insert into public.subcategories (id, name, category_id) values
  ('wedding', 'Wedding', 'Future'),
  ('car', 'Car', 'Future')
on conflict (id) do update set name = excluded.name, category_id = excluded.category_id;

-- Fixed
insert into public.subcategories (id, name, category_id) values
  ('mortgage', 'Mortgage', 'Fixed'),
  ('rent', 'Rent (if don''t own)', 'Fixed'),
  ('utilities', 'Utilities', 'Fixed'),
  ('internet', 'Internet', 'Fixed'),
  ('cell_phone', 'Cell Phone', 'Fixed'),
  ('whole_life', 'Whole Life Insurance', 'Fixed'),
  ('disability', 'Disability Insurance', 'Fixed'),
  ('health_insurance', 'Health insurance', 'Fixed'),
  ('car_payment', 'Car Payment', 'Fixed'),
  ('car_insurance', 'Car Insurance', 'Fixed'),
  ('tuition', 'Tuition', 'Fixed'),
  ('subscriptions', 'Subscription', 'Fixed')
on conflict (id) do update set name = excluded.name, category_id = excluded.category_id;

-- Flexible
insert into public.subcategories (id, name, category_id) values
  ('groceries', 'Groceries', 'Flexible'),
  ('dining_out', 'Dining Out', 'Flexible'),
  ('home_supplies', 'Home Supplies', 'Flexible'),
  ('gas', 'Gas', 'Flexible'),
  ('shopping', 'Shopping', 'Flexible'),
  ('beauty', 'Beauty', 'Flexible'),
  ('pet_care', 'Pet Care', 'Flexible'),
  ('entertainment', 'Entertainment', 'Flexible'),
  ('charity', 'Charity/Donations', 'Flexible'),
  ('miscellaneous', 'Miscellaneous', 'Flexible'),
  ('rentals', 'Rentals', 'Flexible'),
  ('business', 'Business/Side-Hustle', 'Flexible')
on conflict (id) do update set name = excluded.name, category_id = excluded.category_id;

-- Luxury
insert into public.subcategories (id, name, category_id) values
  ('travel', 'Travel', 'Luxury'),
  ('gifts', 'Gifts', 'Luxury')
on conflict (id) do update set name = excluded.name, category_id = excluded.category_id;
