-- Migration: 00009_client_fields
-- Add address, phone, and industry columns to clients table

ALTER TABLE clients ADD COLUMN address text;
ALTER TABLE clients ADD COLUMN phone text;
ALTER TABLE clients ADD COLUMN industry text;
