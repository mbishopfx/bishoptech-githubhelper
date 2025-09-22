-- GitHub Agent Dashboard - Minimal Setup
-- Run this in your Supabase SQL Editor to get started quickly

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (simplified)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    github_username VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Repositories table (essential fields only)
CREATE TABLE IF NOT EXISTS repositories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    github_id BIGINT UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    description TEXT,
    html_url TEXT NOT NULL,
    language VARCHAR(100),
    stars INTEGER DEFAULT 0,
    forks INTEGER DEFAULT 0,
    open_issues INTEGER DEFAULT 0,
    tech_stack JSONB DEFAULT '{}',
    analysis_summary TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Slack settings table
CREATE TABLE IF NOT EXISTS slack_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bot_name VARCHAR(255) NOT NULL DEFAULT 'GitHub Agent Bot',
    app_name VARCHAR(255) NOT NULL DEFAULT 'GitHub Agent Dashboard',
    webhook_url TEXT,
    bot_token TEXT,
    signing_secret TEXT,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_settings ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow all for now - tighten in production)
-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON users;
CREATE POLICY "Allow all operations for authenticated users" ON users
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON repositories;
CREATE POLICY "Allow all operations for authenticated users" ON repositories
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON conversations;
CREATE POLICY "Allow all operations for authenticated users" ON conversations
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON messages;
CREATE POLICY "Allow all operations for authenticated users" ON messages
    FOR ALL USING (true);

-- Insert a demo user for testing
INSERT INTO users (id, email, github_username) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'demo@example.com', 'demo-user')
ON CONFLICT (email) DO NOTHING;

-- Success message
SELECT 'Database setup completed successfully! 🎉' as status;
