-- Add setup_token to contacts for welcome email account creation flow.
-- Token is generated when welcome email is sent, consumed when account is created.

alter table contacts
  add column if not exists setup_token uuid default null,
  add column if not exists setup_token_expires_at timestamptz default null,
  add column if not exists setup_completed_at timestamptz default null;

-- Index for fast token lookup on the public welcome page
create unique index if not exists idx_contacts_setup_token
  on contacts (setup_token) where setup_token is not null;
