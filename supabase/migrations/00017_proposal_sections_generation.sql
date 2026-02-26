-- Migration: 00017_proposal_sections_generation
-- Add structured proposal sections (5-page proposal) and AI generation tracking
-- Sections: Overview & Goals, Scope of Project, Project Timeline, Why Brik, Fee Summary

BEGIN;

-- Proposal sections as JSONB array
-- Each element: { type, title, content (markdown), sort_order }
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS sections jsonb DEFAULT '[]';

-- Meeting notes source
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS meeting_notes_url text;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS meeting_notes_content text;

-- AI generation tracking
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS generation_status text DEFAULT 'none'
  CHECK (generation_status IN ('none', 'pending', 'generating', 'completed', 'failed'));
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS generated_at timestamptz;

COMMENT ON COLUMN public.proposals.sections IS 'JSONB array of proposal sections: [{type, title, content, sort_order}]. Types: overview_and_goals, scope_of_project, project_timeline, why_brik, fee_summary';
COMMENT ON COLUMN public.proposals.meeting_notes_url IS 'Notion page URL for the discovery call meeting notes';
COMMENT ON COLUMN public.proposals.meeting_notes_content IS 'Cached plain text of the meeting notes (fetched from Notion)';
COMMENT ON COLUMN public.proposals.generation_status IS 'AI generation status: none, pending, generating, completed, failed';
COMMENT ON COLUMN public.proposals.generated_at IS 'Timestamp when AI generation completed';

COMMIT;
