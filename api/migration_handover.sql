-- Add handover columns to instances
ALTER TABLE instances ADD COLUMN IF NOT EXISTS human_handover_triggers TEXT;
ALTER TABLE instances ADD COLUMN IF NOT EXISTS notification_phone TEXT;

-- Create ai_disabled_contacts table
CREATE TABLE IF NOT EXISTS ai_disabled_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID REFERENCES instances(id) ON DELETE CASCADE,
    remote_jid TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup in webhook
CREATE INDEX IF NOT EXISTS idx_ai_disabled_contacts_instance_jid ON ai_disabled_contacts(instance_id, remote_jid);

-- Create attendants table for Round-Robin
CREATE TABLE IF NOT EXISTS attendants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID REFERENCES instances(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_handover_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for round-robin sorting
CREATE INDEX IF NOT EXISTS idx_attendants_last_handover ON attendants(instance_id, last_handover_at);
