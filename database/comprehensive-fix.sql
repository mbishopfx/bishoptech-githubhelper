-- GitHub Agent Dashboard - Comprehensive Database Fix
-- Copy and paste this ENTIRE script into Supabase SQL Editor to fix all schema issues

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====== TODO TABLES FIX ======

-- Create todo_lists table if it doesn't exist
CREATE TABLE IF NOT EXISTS todo_lists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active', -- e.g., 'active', 'completed', 'archived'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create todo_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS todo_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    todo_list_id UUID REFERENCES todo_lists(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- e.g., 'pending', 'completed', 'in-progress'
    priority VARCHAR(50) DEFAULT 'medium', -- e.g., 'low', 'medium', 'high'
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN DEFAULT FALSE, -- Keep for backwards compatibility
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to todo_items if they don't exist
DO $$ 
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'todo_items' AND column_name = 'status'
    ) THEN
        ALTER TABLE todo_items ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
        -- Update existing rows to have proper status based on completed field
        UPDATE todo_items SET status = CASE WHEN completed = true THEN 'completed' ELSE 'pending' END WHERE status IS NULL;
    END IF;

    -- Add priority column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'todo_items' AND column_name = 'priority'
    ) THEN
        ALTER TABLE todo_items ADD COLUMN priority VARCHAR(50) DEFAULT 'medium';
    END IF;

    -- Add assigned_to column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'todo_items' AND column_name = 'assigned_to'
    ) THEN
        ALTER TABLE todo_items ADD COLUMN assigned_to UUID;
        ALTER TABLE todo_items ADD CONSTRAINT fk_todo_items_assigned_to 
            FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    -- Add due_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'todo_items' AND column_name = 'due_date'
    ) THEN
        ALTER TABLE todo_items ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add description column if it doesn't exist (in case table existed with different structure)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'todo_items' AND column_name = 'description'
    ) THEN
        ALTER TABLE todo_items ADD COLUMN description TEXT NOT NULL DEFAULT '';
    END IF;
END $$;

-- ====== RECAPS TABLE FIX ======

-- Create recaps table if it doesn't exist
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

-- Add missing columns to recaps if they don't exist
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

-- ====== OTHER MISSING TABLES ======

-- Agent executions table
CREATE TABLE IF NOT EXISTS agent_executions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    agent_type VARCHAR(255) NOT NULL, -- e.g., 'chat', 'todo_generator', 'recap_generator', 'repo_analyzer'
    status VARCHAR(50) DEFAULT 'pending', -- e.g., 'pending', 'in-progress', 'completed', 'failed'
    input JSONB,
    output JSONB,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    steps_taken INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analysis cache table
CREATE TABLE IF NOT EXISTS analysis_cache (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    cache_key VARCHAR(255) NOT NULL, -- e.g., 'tech_stack_v1', 'commit_history_last_month'
    cache_type VARCHAR(255) NOT NULL, -- e.g., 'full_analysis', 'tech_stack', 'commit_history'
    data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(repository_id, cache_key, cache_type)
);

-- ====== RLS POLICIES ======

-- Enable RLS on all tables
ALTER TABLE todo_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_cache ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON todo_lists;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON todo_items;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON recaps;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON agent_executions;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON analysis_cache;

-- Create permissive policies for development (replace with proper policies in production)
CREATE POLICY "Allow all operations for authenticated users" ON todo_lists FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON todo_items FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON recaps FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON agent_executions FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON analysis_cache FOR ALL USING (true);

-- ====== INDEXES FOR PERFORMANCE ======

-- Todo indexes
CREATE INDEX IF NOT EXISTS idx_todo_lists_user_id ON todo_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_todo_lists_repository_id ON todo_lists(repository_id);
CREATE INDEX IF NOT EXISTS idx_todo_items_todo_list_id ON todo_items(todo_list_id);
CREATE INDEX IF NOT EXISTS idx_todo_items_status ON todo_items(status);
CREATE INDEX IF NOT EXISTS idx_todo_items_priority ON todo_items(priority);

-- Recaps indexes
CREATE INDEX IF NOT EXISTS idx_recaps_user_id ON recaps(user_id);
CREATE INDEX IF NOT EXISTS idx_recaps_repository_id ON recaps(repository_id);
CREATE INDEX IF NOT EXISTS idx_recaps_period ON recaps(period);
CREATE INDEX IF NOT EXISTS idx_recaps_generated_at ON recaps(generated_at);

-- Agent execution indexes
CREATE INDEX IF NOT EXISTS idx_agent_executions_user_id ON agent_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_repository_id ON agent_executions(repository_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_status ON agent_executions(status);

-- Cache indexes
CREATE INDEX IF NOT EXISTS idx_analysis_cache_repository_id ON analysis_cache(repository_id);
CREATE INDEX IF NOT EXISTS idx_analysis_cache_expires_at ON analysis_cache(expires_at);

-- Success message
SELECT 'Comprehensive database fix completed successfully! 🎉 All tables updated and ready.' as status;
