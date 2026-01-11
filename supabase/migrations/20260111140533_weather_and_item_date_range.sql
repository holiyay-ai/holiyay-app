BEGIN;

-- Add start_date and end_date columns to items table
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date;

-- Copy existing date values into new columns for migration
UPDATE public.items
SET start_date = date, end_date = date
WHERE start_date IS NULL OR end_date IS NULL;

-- Make start_date NOT NULL (end_date can be NULL for single-day items)
ALTER TABLE public.items
  ALTER COLUMN start_date SET NOT NULL;

-- Ensure end_date is either NULL or not before start_date
ALTER TABLE public.items
  ADD CONSTRAINT items_date_range_check CHECK (end_date IS NULL OR end_date >= start_date);

-- Replace index on date with index on start_date
DROP INDEX IF EXISTS items_calendar_date_idx;
CREATE INDEX IF NOT EXISTS items_calendar_start_date_idx ON public.items (calendar_id, start_date);

-- Drop the old date column
ALTER TABLE public.items
  DROP COLUMN IF EXISTS date;

COMMIT;
