-- Vercel Postgres Schema for VibeLogic
-- Run this in Vercel Dashboard → Storage → Postgres → SQL Editor

-- Users table (auto-populated by Next-Auth)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    image TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Flows table
CREATE TABLE IF NOT EXISTS flows (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled Flow',
    description TEXT,
    nodes JSONB NOT NULL DEFAULT '[]',
    edges JSONB NOT NULL DEFAULT '[]',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Shared flows table (for public sharing links)
CREATE TABLE IF NOT EXISTS shared_flows (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    flow_id TEXT NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
    share_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_flows_user_id ON flows(user_id);
CREATE INDEX IF NOT EXISTS idx_flows_updated_at ON flows(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_flows_token ON shared_flows(share_token);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for flows table
DROP TRIGGER IF EXISTS update_flows_updated_at ON flows;
CREATE TRIGGER update_flows_updated_at
    BEFORE UPDATE ON flows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
