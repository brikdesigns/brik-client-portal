-- Add notion_page_id to services for linking to Notion service catalog pages
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS notion_page_id text;

COMMENT ON COLUMN public.services.notion_page_id IS 'Notion page UUID for the service catalog entry. Used to build deep links.';
