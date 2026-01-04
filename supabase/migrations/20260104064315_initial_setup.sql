-- Migration: 2026-01-04
-- Initial KV store setup.
-- Strict no-op when the table already exists in the database (do nothing).
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'kv_store_19b903d7'
  ) THEN
    -- Create table only when it does not already exist
    EXECUTE $create$
      CREATE TABLE public.kv_store_19b903d7 (
        key TEXT NOT NULL PRIMARY KEY,
        value JSONB NOT NULL
      );
    $create$;

    -- Enable row level security for the newly-created table
    EXECUTE 'ALTER TABLE public.kv_store_19b903d7 ENABLE ROW LEVEL SECURITY';

    -- Create a named index (only when creating the table)
    EXECUTE 'CREATE INDEX kv_store_19b903d7_key_idx ON public.kv_store_19b903d7 (key text_pattern_ops)';
  END IF;
END
$$;

COMMIT;
