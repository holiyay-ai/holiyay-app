-- Migration: 2026-01-04
-- Create core tables (calendars, checklists, items, calendar_shares)
-- and enable row-level security on each table.
--
-- Idempotent: uses IF NOT EXISTS / IF NOT EXISTS for indexes so it is safe
-- to run against an existing database without error.
BEGIN;

-- Ensure UUID generation helper is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Calendars
CREATE TABLE IF NOT EXISTS public.calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  destination text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  share_token text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS calendars_share_token_idx ON public.calendars (share_token);
CREATE INDEX IF NOT EXISTS calendars_owner_id_idx ON public.calendars (owner_id);

ALTER TABLE IF EXISTS public.calendars ENABLE ROW LEVEL SECURITY;

-- Checklists
CREATE TABLE IF NOT EXISTS public.checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id uuid NOT NULL REFERENCES public.calendars(id) ON DELETE CASCADE,
  title text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_generated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS checklists_calendar_id_idx ON public.checklists (calendar_id);

ALTER TABLE IF EXISTS public.checklists ENABLE ROW LEVEL SECURITY;

-- Items
CREATE TABLE IF NOT EXISTS public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id uuid NOT NULL REFERENCES public.calendars(id) ON DELETE CASCADE,
  checklist_id uuid NULL REFERENCES public.checklists(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NULL,
  date date NOT NULL,
  start_time text NULL,
  end_time text NULL,
  location text NULL,
  category text NOT NULL DEFAULT 'other',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT items_category_check CHECK (category IN ('activity','transport','food','lodging','other'))
);

CREATE INDEX IF NOT EXISTS items_calendar_id_idx ON public.items (calendar_id);
CREATE INDEX IF NOT EXISTS items_calendar_date_idx ON public.items (calendar_id, date);

ALTER TABLE IF EXISTS public.items ENABLE ROW LEVEL SECURITY;

-- Calendar shares
CREATE TABLE IF NOT EXISTS public.calendar_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id uuid NOT NULL REFERENCES public.calendars(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  permission text NOT NULL DEFAULT 'view',
  invited_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT calendar_shares_permission_check CHECK (permission IN ('view','edit'))
);

CREATE INDEX IF NOT EXISTS calendar_shares_calendar_id_idx ON public.calendar_shares (calendar_id);
CREATE INDEX IF NOT EXISTS calendar_shares_user_id_idx ON public.calendar_shares (user_id);

ALTER TABLE IF EXISTS public.calendar_shares ENABLE ROW LEVEL SECURITY;

COMMIT;
