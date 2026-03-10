-- Add type column to report_sets for categorizing analyses
alter table public.report_sets
  add column type text not null default 'marketing_analysis'
  check (type in ('marketing_analysis'));

-- Backfill existing rows
update public.report_sets set type = 'marketing_analysis' where type is null;
