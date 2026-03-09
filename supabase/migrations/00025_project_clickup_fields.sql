-- Migration 00025: Add ClickUp detail fields to projects
-- Tracks folder, list, assignee, type, and status from ClickUp

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS clickup_folder_id text,
  ADD COLUMN IF NOT EXISTS clickup_list_id text,
  ADD COLUMN IF NOT EXISTS clickup_assignee text,
  ADD COLUMN IF NOT EXISTS clickup_type text,
  ADD COLUMN IF NOT EXISTS clickup_status text;

COMMENT ON COLUMN public.projects.clickup_folder_id IS 'ClickUp folder ID containing this project';
COMMENT ON COLUMN public.projects.clickup_list_id IS 'ClickUp list ID containing this project';
COMMENT ON COLUMN public.projects.clickup_assignee IS 'ClickUp assignee name or ID';
COMMENT ON COLUMN public.projects.clickup_type IS 'ClickUp task type (e.g. task, milestone)';
COMMENT ON COLUMN public.projects.clickup_status IS 'ClickUp status (synced from ClickUp, may differ from portal status)';
