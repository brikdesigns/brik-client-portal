-- Migration 00008: ClickUp Integration
-- Adds clickup_task_id to projects table for linking portal projects to ClickUp tasks.

ALTER TABLE projects ADD COLUMN clickup_task_id text;

-- Partial unique index: only enforces uniqueness on non-null values.
-- Multiple projects can have NULL clickup_task_id (not yet linked to ClickUp).
CREATE UNIQUE INDEX idx_projects_clickup_task_id
  ON projects (clickup_task_id) WHERE clickup_task_id IS NOT NULL;
