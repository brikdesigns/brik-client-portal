-- Migration: 00033_user_activity.sql
-- User activity tracking table for login history and session events
--
-- Used on the contact detail page Activity tab to show login history.
-- Populated by auth hooks or middleware on sign-in events.

-- ============================================
-- 1. USER_ACTIVITY TABLE
-- ============================================
CREATE TABLE public.user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'login'
    CHECK (event_type IN ('login', 'logout', 'password_reset', 'invite_accepted')),
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_created_at ON public.user_activity(created_at DESC);

-- RLS: Admins see all, users see their own
CREATE POLICY "user_activity_select" ON public.user_activity
  FOR SELECT USING (
    public.is_brik_admin()
    OR auth.uid() = user_id
  );

-- Only system (service role) or admins can insert
CREATE POLICY "user_activity_admin_insert" ON public.user_activity
  FOR INSERT WITH CHECK (
    public.is_brik_admin()
  );

COMMENT ON TABLE public.user_activity IS
  'Tracks user login events, password resets, and other auth activity. Populated by middleware/hooks.';
