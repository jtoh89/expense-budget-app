-- Optional: remove `single_column` if you already ran an older migration that added it.
-- The app no longer uses this column: "single column" mode is stored as `credit_header` IS NULL
-- with the amount column name in `debit_header`.

-- ALTER TABLE public.cards DROP COLUMN IF EXISTS single_column;
