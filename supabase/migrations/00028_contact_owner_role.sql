-- Overhaul contact roles: remove 'client', add 'owner' and 'team_member'
--
-- Contact role = organizational role at their company, NOT portal access level.
-- Portal access is profiles.role (super_admin | client).
-- Company permissions are company_users.role (owner | admin | member | viewer).
--
-- Contact role hierarchy:
--   owner       → business owner, decision-maker, signs contracts
--   admin       → office manager, ops lead, day-to-day authority
--   manager     → department/project manager
--   team_member → regular staff, limited involvement
--
-- Mapping to company_users.role when granting portal access:
--   contact.owner       → company_users.owner
--   contact.admin       → company_users.admin
--   contact.manager     → company_users.member
--   contact.team_member → company_users.viewer

-- Migrate existing 'client' contacts to 'team_member'
UPDATE contacts SET role = 'team_member' WHERE role = 'client';

-- Replace constraint with new role set
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_role_check;
ALTER TABLE contacts ADD CONSTRAINT contacts_role_check
  CHECK (role IN ('owner', 'admin', 'manager', 'team_member'));

-- Update default from 'client' to 'team_member'
ALTER TABLE contacts ALTER COLUMN role SET DEFAULT 'team_member';
