-- GitHub Agent Dashboard - Schema Updates
-- Run this in Supabase SQL Editor to add missing columns and update existing tables

-- Add missing columns to todo_items table
ALTER TABLE todo_items ADD COLUMN IF NOT EXISTS estimated_hours INTEGER DEFAULT 0;
ALTER TABLE todo_items ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add missing columns to recaps table  
ALTER TABLE recaps ADD COLUMN IF NOT EXISTS key_updates JSONB DEFAULT '[]';
ALTER TABLE recaps ADD COLUMN IF NOT EXISTS action_items JSONB DEFAULT '[]';
ALTER TABLE recaps ADD COLUMN IF NOT EXISTS metrics JSONB DEFAULT '{}';
ALTER TABLE recaps ADD COLUMN IF NOT EXISTS date_range JSONB DEFAULT '{}';
ALTER TABLE recaps ADD COLUMN IF NOT EXISTS generated_by VARCHAR(50) DEFAULT 'manual';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_todo_items_status ON todo_items(status);
CREATE INDEX IF NOT EXISTS idx_todo_items_priority ON todo_items(priority);
CREATE INDEX IF NOT EXISTS idx_recaps_generated_by ON recaps(generated_by);
CREATE INDEX IF NOT EXISTS idx_recaps_period ON recaps(period);
CREATE INDEX IF NOT EXISTS idx_repositories_language ON repositories(language);
CREATE INDEX IF NOT EXISTS idx_repositories_last_analyzed ON repositories(last_analyzed);

-- Update existing policies to ensure proper access
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON todo_lists;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON todo_items;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON recaps;

CREATE POLICY "Allow all operations for authenticated users" ON todo_lists FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON todo_items FOR ALL USING (true);  
CREATE POLICY "Allow all operations for authenticated users" ON recaps FOR ALL USING (true);

-- Success message
SELECT 'Schema updates completed successfully! 🎉' as status;
