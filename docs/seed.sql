-- Seed script: run when starting fresh. Idempotent (safe to run multiple times).
-- Requires: categories and subcategories tables to exist.

-- Categories
INSERT INTO public.categories (id, name) VALUES
  ('Pretax', 'Pretax'),
  ('Investments', 'Investments'),
  ('Future', 'Future'),
  ('Fixed', 'Fixed'),
  ('Flexible', 'Flexible'),
  ('Luxury', 'Luxury')
ON CONFLICT (id) DO UPDATE SET name = excluded.name;

-- Subcategories
INSERT INTO public.subcategories (id, name, category_id) VALUES
  ('401k_403b', 'Invest in 401k/403b', 'Pretax'),
  ('457b', 'Invest in 457b', 'Pretax'),
  ('hsa_fsa', 'HSA/FSA', 'Pretax'),
  ('pension', 'SFGH Pension (9.5%)', 'Pretax'),
  ('roth_ira', 'Roth IRA', 'Investments'),
  ('stocks', 'Invest into stocks', 'Investments'),
  ('real_estate', 'Invest in real estate', 'Investments'),
  ('misc_investments', 'Misc Investments', 'Investments'),
  ('wedding', 'Wedding', 'Future'),
  ('car', 'Car', 'Future'),
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
  ('subscriptions', 'Subscription', 'Fixed'),
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
  ('business', 'Business/Side-Hustle', 'Flexible'),
  ('travel', 'Travel', 'Luxury'),
  ('gifts', 'Gifts', 'Luxury')
ON CONFLICT (id) DO UPDATE SET name = excluded.name, category_id = excluded.category_id;
