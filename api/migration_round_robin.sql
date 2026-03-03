-- Add round_robin_active column to instances
ALTER TABLE instances ADD COLUMN IF NOT EXISTS round_robin_active BOOLEAN DEFAULT TRUE;
