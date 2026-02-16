-- Many-to-Many User-Client Relationships
-- Transforms portal from one-user-per-client to many-to-many
-- Allows users (especially admins) to access multiple clients
--
-- Changes:
-- 1. Create client_users junction table with role-based permissions
-- 2. Create Brik Designs as new client
-- 3. Migrate existing profiles.client_id data to client_users
-- 4. Map Nick's account to all 3 clients (Brik Designs, Acme, Pinnacle)
-- 5. Update RLS policies to check client_users membership
-- 6. Keep profiles.client_id temporarily for backward compatibility

-- ============================================
-- 1. CREATE CLIENT_USERS JUNCTION TABLE
-- ============================================
CREATE TABLE public.client_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, client_id)
);

-- Add indexes for performance
CREATE INDEX idx_client_users_user_id ON public.client_users(user_id);
CREATE INDEX idx_client_users_client_id ON public.client_users(client_id);

-- Enable RLS
ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_users
-- Users can see their own memberships; admins see all
CREATE POLICY "client_users_select" ON public.client_users
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.get_user_role() = 'admin'
  );

-- Only admins can manage client_users
CREATE POLICY "client_users_admin_manage" ON public.client_users
  FOR ALL USING (
    public.get_user_role() = 'admin'
  );

-- ============================================
-- 2. CREATE BRIK DESIGNS CLIENT
-- ============================================
INSERT INTO public.clients (
  id,
  name,
  slug,
  status,
  contact_name,
  contact_email,
  website_url,
  notes
) VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'Brik Designs',
  'brik-designs',
  'active',
  'Nick Stanerson',
  'nick@brikdesigns.com',
  'https://brikdesigns.com',
  'Brik Designs company account — default client for admin "View as Client" mode'
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  updated_at = now();

-- ============================================
-- 3. MIGRATE EXISTING DATA
-- ============================================
-- For each profile with a client_id, create a client_users record with role='owner'
INSERT INTO public.client_users (user_id, client_id, role)
SELECT
  id AS user_id,
  client_id,
  'owner' AS role
FROM public.profiles
WHERE client_id IS NOT NULL
ON CONFLICT (user_id, client_id) DO NOTHING;

-- ============================================
-- 4. MAP NICK TO ALL 3 CLIENTS
-- ============================================
-- Nick's user ID: 4c444a10-8cd6-49e2-8f31-434a3c51e8d1
-- Add Nick to Brik Designs (if not already present)
INSERT INTO public.client_users (user_id, client_id, role)
VALUES (
  '4c444a10-8cd6-49e2-8f31-434a3c51e8d1',
  'b0000000-0000-0000-0000-000000000001',
  'owner'
)
ON CONFLICT (user_id, client_id) DO NOTHING;

-- Add Nick to Acme Corporation (if not already present)
INSERT INTO public.client_users (user_id, client_id, role)
VALUES (
  '4c444a10-8cd6-49e2-8f31-434a3c51e8d1',
  'a0000000-0000-0000-0000-000000000001',
  'owner'
)
ON CONFLICT (user_id, client_id) DO NOTHING;

-- Add Nick to Pinnacle Labs (if not already present)
INSERT INTO public.client_users (user_id, client_id, role)
VALUES (
  '4c444a10-8cd6-49e2-8f31-434a3c51e8d1',
  'a0000000-0000-0000-0000-000000000002',
  'owner'
)
ON CONFLICT (user_id, client_id) DO NOTHING;

-- ============================================
-- 5. UPDATE RLS POLICIES TO CHECK CLIENT_USERS
-- ============================================

-- CLIENTS table: Users can see clients they're members of
DROP POLICY IF EXISTS "clients_select" ON public.clients;
CREATE POLICY "clients_select" ON public.clients
  FOR SELECT USING (
    public.get_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.client_users cu
      WHERE cu.client_id = clients.id
        AND cu.user_id = auth.uid()
    )
  );

-- PROJECTS table: Users can see projects for clients they're members of
DROP POLICY IF EXISTS "projects_select" ON public.projects;
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (
    public.get_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.client_users cu
      WHERE cu.client_id = projects.client_id
        AND cu.user_id = auth.uid()
    )
  );

-- INVOICES table: Users can see invoices for clients they're members of
DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
CREATE POLICY "invoices_select" ON public.invoices
  FOR SELECT USING (
    public.get_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.client_users cu
      WHERE cu.client_id = invoices.client_id
        AND cu.user_id = auth.uid()
    )
  );

-- CLIENT_SERVICES table: Users can see services for clients they're members of
DROP POLICY IF EXISTS "client_services_select" ON public.client_services;
CREATE POLICY "client_services_select" ON public.client_services
  FOR SELECT USING (
    public.get_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.client_users cu
      WHERE cu.client_id = client_services.client_id
        AND cu.user_id = auth.uid()
    )
  );

-- ============================================
-- 6. VERIFICATION QUERIES (for testing)
-- ============================================
-- Run these after migration to verify:
--
-- 1. Check Nick has 3 client memberships:
--    SELECT * FROM client_users WHERE user_id = '4c444a10-8cd6-49e2-8f31-434a3c51e8d1';
--
-- 2. Check all profiles have client_users records:
--    SELECT p.id, p.email, p.client_id, cu.client_id as cu_client_id, cu.role
--    FROM profiles p
--    LEFT JOIN client_users cu ON p.id = cu.user_id AND p.client_id = cu.client_id
--    WHERE p.client_id IS NOT NULL;
--
-- 3. Verify Brik Designs client exists:
--    SELECT * FROM clients WHERE id = 'b0000000-0000-0000-0000-000000000001';
