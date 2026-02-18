-- Migration: 00010_prospect_status
-- Change default client status from 'active' to 'prospect'
-- New clients created via Add Client form are prospects until they sign an invoice

ALTER TABLE clients ALTER COLUMN status SET DEFAULT 'prospect';
