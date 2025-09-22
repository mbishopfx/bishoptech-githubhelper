-- GitHub Agent Dashboard Database Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for authentication and personalization)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    github_username VARCHAR(255),
    github_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GitHub repositories table
CREATE TABLE IF NOT EXISTS repositories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    github_id BIGINT UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    description TEXT,
    private BOOLEAN DEFAULT false,
    html_url TEXT NOT NULL,
    clone_url TEXT NOT NULL,
    language VARCHAR(100),
    languages JSONB DEFAULT '{}',
    topics TEXT[] DEFAULT ARRAY[]::TEXT[],
    stars INTEGER DEFAULT 0,
    forks INTEGER DEFAULT 0,
    open_issues INTEGER DEFAULT 0,
    default_branch VARCHAR(100) DEFAULT 'main',
    last_commit_sha VARCHAR(40),
    last_commit_date TIMESTAMP WITH TIME ZONE,
    tech_stack JSONB DEFAULT '{}', -- Analyzed tech stack
    analysis_summary TEXT, -- AI-generated summary
    last_analyzed TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Repository files/structure analysis
CREATE TABLE IF NOT EXISTS repository_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_type VARCHAR(100),
    file_content TEXT, -- Store important files like README, package.json
    analysis TEXT, -- AI analysis of the file
    importance_score INTEGER DEFAULT 0, -- 1-10 for prioritizing files
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(repository_id, file_path)
);

-- Conversations with repositories
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    context JSONB DEFAULT '{}', -- Store conversation context
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual messages in conversations
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}', -- Store agent metadata, tool calls, etc.
    token_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Todo lists and tasks
CREATE TABLE IF NOT EXISTS todo_lists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- 'bug', 'feature', 'maintenance', 'meeting-prep', etc.
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    due_date TIMESTAMP WITH TIME ZONE,
    auto_generated BOOLEAN DEFAULT false, -- Whether AI generated this list
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual todo items
CREATE TABLE IF NOT EXISTS todo_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    todo_list_id UUID REFERENCES todo_lists(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT false,
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assignee VARCHAR(255), -- GitHub username or email
    labels TEXT[] DEFAULT ARRAY[]::TEXT[],
    github_issue_url TEXT, -- Link to GitHub issue if created
    estimated_hours INTEGER,
    actual_hours INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Project recaps and summaries
CREATE TABLE IF NOT EXISTS recaps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    key_updates JSONB DEFAULT '[]', -- Array of key update objects
    tech_changes JSONB DEFAULT '[]', -- Array of technical changes
    issues_resolved JSONB DEFAULT '[]', -- Array of resolved issues
    new_features JSONB DEFAULT '[]', -- Array of new features
    performance_metrics JSONB DEFAULT '{}', -- Performance data
    team_contributions JSONB DEFAULT '{}', -- Team member contributions
    next_steps JSONB DEFAULT '[]', -- Recommended next steps
    meeting_ready BOOLEAN DEFAULT false, -- Whether this is formatted for meetings
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LangGraph agent execution state
CREATE TABLE IF NOT EXISTS agent_executions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    agent_type VARCHAR(100) NOT NULL, -- 'repo_analyzer', 'todo_creator', 'recap_generator', etc.
    graph_state JSONB DEFAULT '{}', -- Current state of the LangGraph
    input_data JSONB DEFAULT '{}', -- Input to the agent
    output_data JSONB DEFAULT '{}', -- Output from the agent
    status VARCHAR(50) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'paused')),
    error_message TEXT,
    step_count INTEGER DEFAULT 0,
    token_usage INTEGER DEFAULT 0,
    execution_time INTEGER, -- milliseconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent execution steps (for debugging and monitoring)
CREATE TABLE IF NOT EXISTS agent_steps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    execution_id UUID REFERENCES agent_executions(id) ON DELETE CASCADE,
    step_name VARCHAR(255) NOT NULL,
    step_type VARCHAR(100), -- 'tool_call', 'llm_call', 'decision', etc.
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    duration INTEGER, -- milliseconds
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Repository analysis cache
CREATE TABLE IF NOT EXISTS analysis_cache (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    analysis_type VARCHAR(100) NOT NULL, -- 'tech_stack', 'structure', 'dependencies', etc.
    cache_key VARCHAR(255) NOT NULL,
    cached_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(repository_id, analysis_type, cache_key)
);

-- Slack integration settings
CREATE TABLE IF NOT EXISTS slack_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bot_name VARCHAR(255) NOT NULL DEFAULT 'GitHub Agent Bot',
    app_name VARCHAR(255) NOT NULL DEFAULT 'GitHub Agent Dashboard',
    description TEXT DEFAULT 'AI-powered GitHub repository assistant for Slack',
    webhook_url TEXT,
    bot_token TEXT, -- Encrypted
    signing_secret TEXT, -- Encrypted
    client_id VARCHAR(255),
    client_secret TEXT, -- Encrypted
    verification_token TEXT, -- Encrypted
    features JSONB DEFAULT '{
        "chat_commands": true,
        "repo_updates": true,
        "todo_notifications": true,
        "meeting_recaps": true,
        "direct_messages": true
    }',
    scopes TEXT[] DEFAULT ARRAY[
        'channels:read',
        'chat:write',
        'commands',
        'im:write',
        'users:read',
        'app_mentions:read'
    ],
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX idx_repositories_user_id ON repositories(user_id);
CREATE INDEX idx_repositories_github_id ON repositories(github_id);
CREATE INDEX idx_repositories_is_active ON repositories(is_active);
CREATE INDEX idx_repository_files_repository_id ON repository_files(repository_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_repository_id ON conversations(repository_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_todo_lists_user_id ON todo_lists(user_id);
CREATE INDEX idx_todo_lists_repository_id ON todo_lists(repository_id);
CREATE INDEX idx_todo_items_todo_list_id ON todo_items(todo_list_id);
CREATE INDEX idx_recaps_user_id ON recaps(user_id);
CREATE INDEX idx_recaps_repository_id ON recaps(repository_id);
CREATE INDEX idx_agent_executions_user_id ON agent_executions(user_id);
CREATE INDEX idx_agent_executions_status ON agent_executions(status);
CREATE INDEX idx_agent_steps_execution_id ON agent_steps(execution_id);
CREATE INDEX idx_analysis_cache_repository_id ON analysis_cache(repository_id);
CREATE INDEX idx_analysis_cache_expires_at ON analysis_cache(expires_at);

-- RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE repository_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_cache ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can only access their own data)
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own repositories" ON repositories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own repository files" ON repository_files FOR ALL USING (
    auth.uid() = (SELECT user_id FROM repositories WHERE id = repository_files.repository_id)
);

CREATE POLICY "Users can manage own conversations" ON conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own messages" ON messages FOR ALL USING (
    auth.uid() = (SELECT user_id FROM conversations WHERE id = messages.conversation_id)
);

CREATE POLICY "Users can manage own todo lists" ON todo_lists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own todo items" ON todo_items FOR ALL USING (
    auth.uid() = (SELECT user_id FROM todo_lists WHERE id = todo_items.todo_list_id)
);

CREATE POLICY "Users can manage own recaps" ON recaps FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own agent executions" ON agent_executions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own agent steps" ON agent_steps FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM agent_executions WHERE id = agent_steps.execution_id)
);

CREATE POLICY "Users can manage own analysis cache" ON analysis_cache FOR ALL USING (
    auth.uid() = (SELECT user_id FROM repositories WHERE id = analysis_cache.repository_id)
);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_repositories_updated_at BEFORE UPDATE ON repositories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_repository_files_updated_at BEFORE UPDATE ON repository_files FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_todo_lists_updated_at BEFORE UPDATE ON todo_lists FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_todo_items_updated_at BEFORE UPDATE ON todo_items FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_recaps_updated_at BEFORE UPDATE ON recaps FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_agent_executions_updated_at BEFORE UPDATE ON agent_executions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
