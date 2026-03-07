-- Migration: 00024_fix_report_items_status.sql
-- Add 'fail' to report_items status constraint.
-- The analyzers (reviews, competitors) use 'fail' for listings not found,
-- but the original constraint only allowed ('pass','warning','error','neutral').
-- This mismatch caused the entire batch insert to fail silently, leaving
-- report detail tables empty.

-- Drop old constraint and add updated one
alter table public.report_items
  drop constraint if exists report_items_status_check;

alter table public.report_items
  add constraint report_items_status_check
  check (status in ('pass','warning','fail','error','neutral'));

-- Normalize any legacy 'error' values to 'fail' for consistency
update public.report_items set status = 'fail' where status = 'error';
