-- GitHub Agent Dashboard - Fix Todo Schema
-- Run this in Supabase SQL Editor to fix todo_items table structure

-- First, check if todo_lists table exists
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

-- Create or update todo_items table
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

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'todo_items' AND column_name = 'status'
    ) THEN
        ALTER TABLE todo_items ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
        -- Update existing rows to have proper status based on completed field
        UPDATE todo_items SET status = CASE WHEN completed = true THEN 'completed' ELSE 'pending' END;
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
        ALTER TABLE todo_items ADD COLUMN assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    -- Add due_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'todo_items' AND column_name = 'due_date'
    ) THEN
        ALTER TABLE todo_items ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE todo_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON todo_lists;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON todo_items;

-- Create permissive policies for development
CREATE POLICY "Allow all operations for authenticated users" ON todo_lists FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON todo_items FOR ALL USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_todo_lists_user_id ON todo_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_todo_lists_repository_id ON todo_lists(repository_id);
CREATE INDEX IF NOT EXISTS idx_todo_items_todo_list_id ON todo_items(todo_list_id);
CREATE INDEX IF NOT EXISTS idx_todo_items_status ON todo_items(status);
CREATE INDEX IF NOT EXISTS idx_todo_items_priority ON todo_items(priority);

-- Success message
SELECT 'Todo schema fixed successfully! 🎉' as status;
