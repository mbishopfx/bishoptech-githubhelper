-- Enhanced Schema Updates for Advanced Todo Generation and Recap System
-- This file contains updates to support the new LangGraph-based AI features

-- Add deployment tracking fields to recaps table
ALTER TABLE recaps 
ADD COLUMN IF NOT EXISTS deployment_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS action_items JSONB DEFAULT '[]';

-- Update metrics column in recaps to support deployment data
COMMENT ON COLUMN recaps.deployment_info IS 'Vercel/deployment platform integration data';
COMMENT ON COLUMN recaps.action_items IS 'AI-generated action items from recap analysis';

-- Add enhanced fields to todo_lists table for better AI categorization
ALTER TABLE todo_lists 
ADD COLUMN IF NOT EXISTS generation_type VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS analysis_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 0 CHECK (health_score >= 0 AND health_score <= 100);

-- Add enhanced fields to todo_items table
ALTER TABLE todo_items 
ADD COLUMN IF NOT EXISTS impact_score INTEGER DEFAULT 5 CHECK (impact_score >= 1 AND impact_score <= 10),
ADD COLUMN IF NOT EXISTS urgency_score INTEGER DEFAULT 5 CHECK (urgency_score >= 1 AND urgency_score <= 10),
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS rationale TEXT,
ADD COLUMN IF NOT EXISTS github_issue_number INTEGER,
ADD COLUMN IF NOT EXISTS dependencies TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';

-- Create deployment cache table for Vercel integration
CREATE TABLE IF NOT EXISTS deployment_cache (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL DEFAULT 'vercel',
    project_id VARCHAR(255),
    production_url TEXT,
    preview_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    domains TEXT[] DEFAULT ARRAY[]::TEXT[],
    last_deployment JSONB DEFAULT '{}',
    deployment_status VARCHAR(50) DEFAULT 'unknown',
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for deployment cache
CREATE INDEX IF NOT EXISTS idx_deployment_cache_repository_id ON deployment_cache(repository_id);
CREATE INDEX IF NOT EXISTS idx_deployment_cache_expires_at ON deployment_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_deployment_cache_platform ON deployment_cache(platform);

-- Update agent executions to support better categorization
ALTER TABLE agent_executions 
ADD COLUMN IF NOT EXISTS analysis_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS performance_metrics JSONB DEFAULT '{}';

-- Add comprehensive logging table for AI operations
CREATE TABLE IF NOT EXISTS ai_operation_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    operation_type VARCHAR(100) NOT NULL, -- 'todo_generation', 'recap_generation', 'health_check'
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    execution_id UUID REFERENCES agent_executions(id) ON DELETE CASCADE,
    input_parameters JSONB DEFAULT '{}',
    output_results JSONB DEFAULT '{}',
    execution_time_ms INTEGER,
    tokens_used INTEGER DEFAULT 0,
    cost_usd DECIMAL(10, 6) DEFAULT 0,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for AI operation logs
CREATE INDEX IF NOT EXISTS idx_ai_operation_logs_operation_type ON ai_operation_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_ai_operation_logs_repository_id ON ai_operation_logs(repository_id);
CREATE INDEX IF NOT EXISTS idx_ai_operation_logs_created_at ON ai_operation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_operation_logs_success ON ai_operation_logs(success);

-- Create health check results table
CREATE TABLE IF NOT EXISTS health_check_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    check_type VARCHAR(100) NOT NULL, -- 'deployment', 'security', 'performance', 'dependencies'
    status VARCHAR(50) DEFAULT 'unknown', -- 'healthy', 'warning', 'critical', 'unknown'
    score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    details JSONB DEFAULT '{}',
    recommendations JSONB DEFAULT '[]',
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for health checks
CREATE INDEX IF NOT EXISTS idx_health_check_results_repository_id ON health_check_results(repository_id);
CREATE INDEX IF NOT EXISTS idx_health_check_results_check_type ON health_check_results(check_type);
CREATE INDEX IF NOT EXISTS idx_health_check_results_status ON health_check_results(status);
CREATE INDEX IF NOT EXISTS idx_health_check_results_checked_at ON health_check_results(checked_at);

-- Update repositories table with enhanced analysis fields
ALTER TABLE repositories 
ADD COLUMN IF NOT EXISTS activity_score INTEGER DEFAULT 0 CHECK (activity_score >= 0 AND activity_score <= 100),
ADD COLUMN IF NOT EXISTS architecture_score INTEGER DEFAULT 0 CHECK (architecture_score >= 0 AND architecture_score <= 100),
ADD COLUMN IF NOT EXISTS production_ready BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deployment_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS health_metrics JSONB DEFAULT '{}';

-- Add todo list templates table for reusable todo patterns
CREATE TABLE IF NOT EXISTS todo_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    template_data JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for todo templates
CREATE INDEX IF NOT EXISTS idx_todo_templates_user_id ON todo_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_todo_templates_category ON todo_templates(category);
CREATE INDEX IF NOT EXISTS idx_todo_templates_is_public ON todo_templates(is_public);

-- Add RLS policies for new tables
ALTER TABLE deployment_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_operation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_check_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for deployment cache
CREATE POLICY "Users can manage deployment cache for their repositories" ON deployment_cache FOR ALL USING (
    EXISTS (SELECT 1 FROM repositories WHERE repositories.id = deployment_cache.repository_id AND repositories.user_id = auth.uid())
);

-- RLS policies for AI operation logs
CREATE POLICY "Users can view their AI operation logs" ON ai_operation_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert AI operation logs" ON ai_operation_logs FOR INSERT WITH CHECK (true);

-- RLS policies for health check results
CREATE POLICY "Users can manage health checks for their repositories" ON health_check_results FOR ALL USING (
    EXISTS (SELECT 1 FROM repositories WHERE repositories.id = health_check_results.repository_id AND repositories.user_id = auth.uid())
);

-- RLS policies for todo templates
CREATE POLICY "Users can manage their own todo templates" ON todo_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view public todo templates" ON todo_templates FOR SELECT USING (is_public = true);

-- Update triggers for new tables
CREATE TRIGGER update_deployment_cache_updated_at BEFORE UPDATE ON deployment_cache FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_todo_templates_updated_at BEFORE UPDATE ON todo_templates FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create view for comprehensive repository analysis
CREATE OR REPLACE VIEW repository_analysis_summary AS
SELECT 
    r.id,
    r.name,
    r.full_name,
    r.language,
    r.stars,
    r.forks,
    r.activity_score,
    r.architecture_score,
    r.production_ready,
    r.last_analyzed,
    
    -- Latest deployment info
    dc.production_url,
    dc.deployment_status,
    dc.last_deployment,
    
    -- Health check summary
    COALESCE(AVG(hcr.score), 0) as average_health_score,
    COUNT(CASE WHEN hcr.status = 'critical' THEN 1 END) as critical_issues,
    COUNT(CASE WHEN hcr.status = 'warning' THEN 1 END) as warnings,
    
    -- Todo summary
    COUNT(DISTINCT tl.id) as todo_lists_count,
    COUNT(CASE WHEN ti.completed = false THEN 1 END) as pending_todos,
    COUNT(CASE WHEN ti.completed = true THEN 1 END) as completed_todos,
    
    -- Recent activity
    COUNT(DISTINCT aol.id) as ai_operations_last_week,
    
    r.updated_at
FROM repositories r
LEFT JOIN deployment_cache dc ON r.id = dc.repository_id AND dc.expires_at > NOW()
LEFT JOIN health_check_results hcr ON r.id = hcr.repository_id AND hcr.checked_at > NOW() - INTERVAL '7 days'
LEFT JOIN todo_lists tl ON r.id = tl.repository_id
LEFT JOIN todo_items ti ON tl.id = ti.todo_list_id
LEFT JOIN ai_operation_logs aol ON r.id = aol.repository_id AND aol.created_at > NOW() - INTERVAL '7 days'
GROUP BY 
    r.id, r.name, r.full_name, r.language, r.stars, r.forks, 
    r.activity_score, r.architecture_score, r.production_ready, r.last_analyzed,
    dc.production_url, dc.deployment_status, dc.last_deployment, r.updated_at;

-- Create function to cleanup expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache() RETURNS void AS $$
BEGIN
    DELETE FROM analysis_cache WHERE expires_at < NOW();
    DELETE FROM deployment_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to update repository scores
CREATE OR REPLACE FUNCTION update_repository_scores(repo_id UUID) RETURNS void AS $$
DECLARE
    avg_health DECIMAL;
    todo_completion_rate DECIMAL;
    recent_activity INTEGER;
BEGIN
    -- Calculate average health score
    SELECT COALESCE(AVG(score), 0) INTO avg_health
    FROM health_check_results 
    WHERE repository_id = repo_id AND checked_at > NOW() - INTERVAL '7 days';
    
    -- Calculate todo completion rate
    SELECT 
        CASE 
            WHEN COUNT(*) = 0 THEN 0
            ELSE (COUNT(CASE WHEN completed THEN 1 END) * 100.0 / COUNT(*))
        END INTO todo_completion_rate
    FROM todo_items ti
    JOIN todo_lists tl ON ti.todo_list_id = tl.id
    WHERE tl.repository_id = repo_id;
    
    -- Count recent AI operations
    SELECT COUNT(*) INTO recent_activity
    FROM ai_operation_logs 
    WHERE repository_id = repo_id AND created_at > NOW() - INTERVAL '30 days';
    
    -- Update repository with calculated scores
    UPDATE repositories SET
        health_metrics = jsonb_build_object(
            'average_health_score', avg_health,
            'todo_completion_rate', todo_completion_rate,
            'recent_ai_operations', recent_activity,
            'last_calculated', NOW()
        ),
        updated_at = NOW()
    WHERE id = repo_id;
END;
$$ LANGUAGE plpgsql;

-- Insert sample todo templates
INSERT INTO todo_templates (name, description, category, template_data, is_public, user_id) VALUES
('Security Audit Checklist', 'Comprehensive security review tasks', 'security', 
 '[
    {"title": "Review authentication implementation", "priority": "high", "estimated_hours": 4},
    {"title": "Scan for security vulnerabilities", "priority": "high", "estimated_hours": 2},
    {"title": "Update dependencies with security patches", "priority": "medium", "estimated_hours": 3},
    {"title": "Implement input validation", "priority": "high", "estimated_hours": 6}
 ]'::jsonb, true, '550e8400-e29b-41d4-a716-446655440000'),

('Performance Optimization', 'Tasks to improve application performance', 'performance',
 '[
    {"title": "Optimize database queries", "priority": "high", "estimated_hours": 8},
    {"title": "Implement caching strategy", "priority": "medium", "estimated_hours": 6},
    {"title": "Optimize image loading", "priority": "medium", "estimated_hours": 4},
    {"title": "Bundle size optimization", "priority": "low", "estimated_hours": 3}
 ]'::jsonb, true, '550e8400-e29b-41d4-a716-446655440000'),

('Documentation Update', 'Essential documentation tasks', 'documentation',
 '[
    {"title": "Update README with setup instructions", "priority": "medium", "estimated_hours": 2},
    {"title": "Document API endpoints", "priority": "medium", "estimated_hours": 4},
    {"title": "Create architecture diagrams", "priority": "low", "estimated_hours": 3},
    {"title": "Write deployment guide", "priority": "medium", "estimated_hours": 2}
 ]'::jsonb, true, '550e8400-e29b-41d4-a716-446655440000')

ON CONFLICT DO NOTHING;

COMMENT ON TABLE deployment_cache IS 'Caches deployment information from various platforms (Vercel, Netlify, etc.)';
COMMENT ON TABLE ai_operation_logs IS 'Comprehensive logging for all AI operations including costs and performance metrics';
COMMENT ON TABLE health_check_results IS 'Results from automated health checks on repositories';
COMMENT ON TABLE todo_templates IS 'Reusable todo list templates for common development tasks';
COMMENT ON VIEW repository_analysis_summary IS 'Comprehensive view combining repository data with health, deployment, and todo metrics';

-- Add environment variables documentation
COMMENT ON DATABASE github_agent_dashboard IS 'Enhanced GitHub Agent Dashboard with AI-powered todo generation, deployment tracking, and comprehensive project analysis. Required environment variables: VERCEL_API_TOKEN, OPENAI_API_KEY, GITHUB_TOKEN';

-- Success message
SELECT 'Enhanced schema updates completed successfully! New features include:
- Advanced todo generation with LangGraph
- Vercel deployment integration  
- Comprehensive health checks
- AI operation logging and cost tracking
- Repository analysis scoring
- Reusable todo templates
- Performance optimizations' AS enhancement_summary;
