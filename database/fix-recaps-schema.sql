-- GitHub Agent Dashboard - Fix Recaps Schema
-- Run this in Supabase SQL Editor to fix recaps table structure

-- Create or update recaps table
CREATE TABLE IF NOT EXISTS recaps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    period VARCHAR(50), -- e.g., 'daily', 'weekly', 'monthly', 'quarterly'
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metrics JSONB DEFAULT '{}', -- e.g., {commits: 10, issues_closed: 5}
    key_updates TEXT[] DEFAULT ARRAY[]::TEXT[],
    action_items TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add metrics column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recaps' AND column_name = 'metrics'
    ) THEN
        ALTER TABLE recaps ADD COLUMN metrics JSONB DEFAULT '{}';
    END IF;

    -- Add key_updates column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recaps' AND column_name = 'key_updates'
    ) THEN
        ALTER TABLE recaps ADD COLUMN key_updates TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;

    -- Add action_items column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recaps' AND column_name = 'action_items'
    ) THEN
        ALTER TABLE recaps ADD COLUMN action_items TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;

    -- Add generated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recaps' AND column_name = 'generated_at'
    ) THEN
        ALTER TABLE recaps ADD COLUMN generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Add period column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recaps' AND column_name = 'period'
    ) THEN
        ALTER TABLE recaps ADD COLUMN period VARCHAR(50);
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE recaps ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON recaps;

-- Create permissive policies for development
CREATE POLICY "Allow all operations for authenticated users" ON recaps FOR ALL USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recaps_user_id ON recaps(user_id);
CREATE INDEX IF NOT EXISTS idx_recaps_repository_id ON recaps(repository_id);
CREATE INDEX IF NOT EXISTS idx_recaps_period ON recaps(period);
CREATE INDEX IF NOT EXISTS idx_recaps_generated_at ON recaps(generated_at);

-- Success message
SELECT 'Recaps schema fixed successfully! 🎉' as status;
