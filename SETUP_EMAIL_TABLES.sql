-- ================================================================
-- EMAIL REPORTING TABLES SETUP
-- Run this SQL in your Supabase SQL Editor to enable email reporting
-- ================================================================

-- 1. Create email_settings table
CREATE TABLE IF NOT EXISTS public.email_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    smtp_host VARCHAR(255) NOT NULL DEFAULT 'smtp.gmail.com',
    smtp_port INTEGER NOT NULL DEFAULT 587,
    smtp_secure BOOLEAN NOT NULL DEFAULT FALSE,
    smtp_user VARCHAR(255) NOT NULL,
    smtp_password VARCHAR(500) NOT NULL,
    sender_name VARCHAR(255) NOT NULL DEFAULT 'GitHub Helper',
    sender_email VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500) DEFAULT '/whitelogo.png',
    company_name VARCHAR(255) DEFAULT 'GitHub Helper',
    primary_color VARCHAR(7) DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('repository_report', 'alert', 'notification')),
    subject VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create repository_reports table
CREATE TABLE IF NOT EXISTS public.repository_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    repository_id UUID NOT NULL,
    title VARCHAR(500) NOT NULL,
    summary TEXT,
    commit_summary JSONB DEFAULT '[]',
    issue_summary JSONB DEFAULT '{}',
    pull_request_summary JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    recipients TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create email_schedules table
CREATE TABLE IF NOT EXISTS public.email_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    repository_id UUID,
    template_id UUID NOT NULL,
    schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'on_event')),
    schedule_config JSONB NOT NULL DEFAULT '{}',
    recipients TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    last_sent_at TIMESTAMP WITH TIME ZONE,
    next_scheduled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create email_queue table
CREATE TABLE IF NOT EXISTS public.email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    template_id UUID,
    report_id UUID,
    to_emails TEXT[] NOT NULL,
    cc_emails TEXT[] DEFAULT '{}',
    bcc_emails TEXT[] DEFAULT '{}',
    subject VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    priority INTEGER DEFAULT 5,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'retry')),
    attempts INTEGER DEFAULT 0,
    error_message TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_email_settings_user_id ON email_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(type);
CREATE INDEX IF NOT EXISTS idx_repository_reports_user_id ON repository_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_repository_reports_repository_id ON repository_reports(repository_id);
CREATE INDEX IF NOT EXISTS idx_repository_reports_period ON repository_reports(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_email_schedules_user_id ON email_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_email_schedules_next_run ON email_schedules(next_scheduled_at) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON email_queue(scheduled_for) WHERE status = 'pending';

-- 7. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers
DROP TRIGGER IF EXISTS update_email_settings_updated_at ON email_settings;
CREATE TRIGGER update_email_settings_updated_at BEFORE UPDATE ON email_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_repository_reports_updated_at ON repository_reports;
CREATE TRIGGER update_repository_reports_updated_at BEFORE UPDATE ON repository_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_schedules_updated_at ON email_schedules;
CREATE TRIGGER update_email_schedules_updated_at BEFORE UPDATE ON email_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_queue_updated_at ON email_queue;
CREATE TRIGGER update_email_queue_updated_at BEFORE UPDATE ON email_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Enable Row Level Security
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE repository_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies (Note: These are for the single-user system)
-- Email Settings Policies
DROP POLICY IF EXISTS "Users can manage their own email settings" ON email_settings;
CREATE POLICY "Users can manage their own email settings" ON email_settings
    FOR ALL USING (user_id = '550e8400-e29b-41d4-a716-446655440000'::UUID);

-- Email Templates Policies  
DROP POLICY IF EXISTS "Users can manage their own email templates" ON email_templates;
CREATE POLICY "Users can manage their own email templates" ON email_templates
    FOR ALL USING (user_id = '550e8400-e29b-41d4-a716-446655440000'::UUID);

-- Repository Reports Policies
DROP POLICY IF EXISTS "Users can manage their own repository reports" ON repository_reports;
CREATE POLICY "Users can manage their own repository reports" ON repository_reports
    FOR ALL USING (user_id = '550e8400-e29b-41d4-a716-446655440000'::UUID);

-- Email Schedules Policies
DROP POLICY IF EXISTS "Users can manage their own email schedules" ON email_schedules;
CREATE POLICY "Users can manage their own email schedules" ON email_schedules
    FOR ALL USING (user_id = '550e8400-e29b-41d4-a716-446655440000'::UUID);

-- Email Queue Policies
DROP POLICY IF EXISTS "Users can manage their own email queue" ON email_queue;
CREATE POLICY "Users can manage their own email queue" ON email_queue
    FOR ALL USING (user_id = '550e8400-e29b-41d4-a716-446655440000'::UUID);

-- 11. Insert default email template
INSERT INTO email_templates (
    user_id, 
    name, 
    type, 
    subject, 
    html_content,
    text_content,
    variables
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000'::UUID,
    'Repository Comprehensive Report',
    'repository_report',
    '📊 Repository Report: {{repository_name}} - {{period_start}}',
    '<!-- The comprehensive HTML template will be managed in code -->',
    'Repository Report for {{repository_name}} - Please view HTML version for full details.',
    ARRAY[
        'repository_name', 'period_start', 'period_end', 'total_size_kb', 'lines_of_code', 
        'file_count', 'complexity_score', 'commit_count', 'total_lines_changed', 'issues_resolved', 
        'prs_merged', 'avg_commits_per_day', 'language_breakdown', 'maintainability_index', 
        'test_coverage', 'security_score', 'technical_debt_ratio', 'most_active_files', 
        'top_contributors', 'total_contributors', 'active_contributors', 'bus_factor', 
        'activity_score', 'summary', 'recommendations', 'company_name', 'logo_url', 'primary_color'
    ]
) ON CONFLICT DO NOTHING;

-- ================================================================
-- SETUP COMPLETE! 
-- Your email reporting system is now ready to use.
-- ================================================================
