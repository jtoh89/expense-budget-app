-- 7. Budgets
CREATE TABLE budgets (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  year INTEGER NOT NULL,
  annual_income NUMERIC(10, 2),
  other_income NUMERIC(10, 2),
  estimated_taxes NUMERIC(10, 2),
  CONSTRAINT budgets_owner_year_unique UNIQUE (owner, year)
);

-- 8. Budget Allocations
CREATE TABLE budget_allocations (
  budget_id TEXT NOT NULL REFERENCES budgets(id),
  subcategory_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  monthly_budget NUMERIC(10, 2),
  annual_budget NUMERIC(10, 2),
  CONSTRAINT budget_allocations_budget_subcategory_unique UNIQUE (budget_id, subcategory_id)
);
