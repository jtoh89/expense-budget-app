-- Migration: Add owner and id columns to budgets table
-- id = owner || '-' || year (e.g. 'yin-2026')
-- Run this in Supabase SQL Editor
--
-- If you get constraint errors, run: SELECT conname FROM pg_constraint WHERE conrelid = 'public.budgets'::regclass;
-- and replace budgets_pkey with your actual primary key name.

-- Step 1: Add owner column (default 'default' for existing rows)
ALTER TABLE public.budgets
ADD COLUMN IF NOT EXISTS owner text DEFAULT 'default';

-- Step 2: Add id column
ALTER TABLE public.budgets
ADD COLUMN IF NOT EXISTS id text;

-- Step 3: Backfill id for existing rows (owner-year)
UPDATE public.budgets
SET id = coalesce(owner, 'default') || '-' || year::text
WHERE id IS NULL;

-- Step 4: Make id NOT NULL
ALTER TABLE public.budgets
ALTER COLUMN id SET NOT NULL;

-- Step 5: Drop existing primary key on year
ALTER TABLE public.budgets
DROP CONSTRAINT IF EXISTS budgets_pkey;

-- Step 6: Add primary key on id
ALTER TABLE public.budgets
ADD PRIMARY KEY (id);

-- Step 7: Add unique constraint on (owner, year)
ALTER TABLE public.budgets
ADD CONSTRAINT budgets_owner_year_unique UNIQUE (owner, year);

-- ============================================================
-- budget_allocations: Add budget_id column
-- ============================================================

-- Step 8: Add budget_id column to budget_allocations
ALTER TABLE public.budget_allocations
ADD COLUMN IF NOT EXISTS budget_id text REFERENCES public.budgets(id);

-- Step 9: Backfill budget_id for existing rows (default-{year})
UPDATE public.budget_allocations
SET budget_id = 'default-' || year::text
WHERE budget_id IS NULL;

-- Step 10: Make budget_id NOT NULL (after backfill)
ALTER TABLE public.budget_allocations
ALTER COLUMN budget_id SET NOT NULL;

-- Step 11: Add unique constraint on (budget_id, subcategory_id) for upserts
-- Drop old unique on (subcategory_id, year) if it exists - check schema for actual name
ALTER TABLE public.budget_allocations
DROP CONSTRAINT IF EXISTS budget_allocations_subcategory_id_year_key;

ALTER TABLE public.budget_allocations
ADD CONSTRAINT budget_allocations_budget_subcategory_unique UNIQUE (budget_id, subcategory_id);
