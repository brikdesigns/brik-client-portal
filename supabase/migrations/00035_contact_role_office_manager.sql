-- Rename contact roles: admin → office_manager, remove manager
-- Must drop constraint first since 'office_manager' isn't in the old allowed set

-- Drop old constraint
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_role_check;

-- Migrate existing rows
UPDATE contacts SET role = 'office_manager' WHERE role IN ('admin', 'manager');

-- Add new constraint
ALTER TABLE contacts ADD CONSTRAINT contacts_role_check
  CHECK (role IN ('owner', 'office_manager', 'team_member'));
