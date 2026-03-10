-- ============================================
-- Migration 00030: Split full_name into first_name + last_name
-- ============================================
-- Both `profiles` and `contacts` tables currently store a single `full_name`.
-- This migration splits it into `first_name` and `last_name`, then replaces
-- the original column with a GENERATED ALWAYS AS column so existing SELECTs
-- that reference `full_name` continue to work without code changes.
--
-- Write paths (INSERT/UPDATE) must target first_name/last_name instead.
-- ============================================

BEGIN;

-- ============================================
-- 1. PROFILES table
-- ============================================

-- Add new columns
ALTER TABLE public.profiles
  ADD COLUMN first_name text,
  ADD COLUMN last_name text;

-- Backfill from existing full_name (first word = first_name, rest = last_name)
UPDATE public.profiles
SET
  first_name = CASE
    WHEN full_name IS NULL OR full_name = '' THEN ''
    WHEN position(' ' in full_name) > 0 THEN left(full_name, position(' ' in full_name) - 1)
    ELSE full_name
  END,
  last_name = CASE
    WHEN full_name IS NULL OR full_name = '' THEN ''
    WHEN position(' ' in full_name) > 0 THEN substring(full_name from position(' ' in full_name) + 1)
    ELSE ''
  END;

-- Set NOT NULL after backfill
ALTER TABLE public.profiles
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN first_name SET DEFAULT '',
  ALTER COLUMN last_name SET NOT NULL,
  ALTER COLUMN last_name SET DEFAULT '';

-- Drop old column and recreate as generated
ALTER TABLE public.profiles DROP COLUMN full_name;
ALTER TABLE public.profiles
  ADD COLUMN full_name text GENERATED ALWAYS AS (
    CASE
      WHEN last_name = '' THEN first_name
      ELSE first_name || ' ' || last_name
    END
  ) STORED;

-- ============================================
-- 2. CONTACTS table
-- ============================================

-- Add new columns
ALTER TABLE public.contacts
  ADD COLUMN first_name text,
  ADD COLUMN last_name text;

-- Backfill from existing full_name
UPDATE public.contacts
SET
  first_name = CASE
    WHEN full_name IS NULL OR full_name = '' THEN ''
    WHEN position(' ' in full_name) > 0 THEN left(full_name, position(' ' in full_name) - 1)
    ELSE full_name
  END,
  last_name = CASE
    WHEN full_name IS NULL OR full_name = '' THEN ''
    WHEN position(' ' in full_name) > 0 THEN substring(full_name from position(' ' in full_name) + 1)
    ELSE ''
  END;

-- Set NOT NULL after backfill
ALTER TABLE public.contacts
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN first_name SET DEFAULT '',
  ALTER COLUMN last_name SET NOT NULL,
  ALTER COLUMN last_name SET DEFAULT '';

-- Drop old column and recreate as generated
ALTER TABLE public.contacts DROP COLUMN full_name;
ALTER TABLE public.contacts
  ADD COLUMN full_name text GENERATED ALWAYS AS (
    CASE
      WHEN last_name = '' THEN first_name
      ELSE first_name || ' ' || last_name
    END
  ) STORED;

-- ============================================
-- 3. Update auth trigger to write first_name/last_name
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  raw_name text;
BEGIN
  raw_name := coalesce(new.raw_user_meta_data->>'full_name', '');

  INSERT INTO public.profiles (id, email, role, first_name, last_name)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    CASE
      WHEN raw_name = '' THEN ''
      WHEN position(' ' in raw_name) > 0 THEN left(raw_name, position(' ' in raw_name) - 1)
      ELSE raw_name
    END,
    CASE
      WHEN raw_name = '' THEN ''
      WHEN position(' ' in raw_name) > 0 THEN substring(raw_name from position(' ' in raw_name) + 1)
      ELSE ''
    END
  );
  RETURN new;
END;
$$;

COMMIT;
