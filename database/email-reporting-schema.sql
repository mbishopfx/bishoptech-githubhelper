-- Email Settings and Reporting Schema
-- GitHub Helper Dashboard - Email functionality

-- Email Settings Table
CREATE TABLE IF NOT EXISTS email_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    smtp_host VARCHAR(255) NOT NULL DEFAULT 'smtp.gmail.com',
    smtp_port INTEGER NOT NULL DEFAULT 587,
    smtp_secure BOOLEAN NOT NULL DEFAULT FALSE,
    smtp_user VARCHAR(255) NOT NULL,
    smtp_password VARCHAR(500) NOT NULL, -- Encrypted
    sender_name VARCHAR(255) NOT NULL DEFAULT 'GitHub Helper',
    sender_email VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500) DEFAULT '/whitelogo.png',
    company_name VARCHAR(255) DEFAULT 'GitHub Helper',
    primary_color VARCHAR(7) DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('repository_report', 'alert', 'notification')),
    subject VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables TEXT[] DEFAULT '{}', -- JSON array of variable names
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Repository Reports Table
CREATE TABLE IF NOT EXISTS repository_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
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

-- Email Schedules Table
CREATE TABLE IF NOT EXISTS email_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,
    schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'on_event')),
    schedule_config JSONB NOT NULL DEFAULT '{}',
    recipients TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    last_sent_at TIMESTAMP WITH TIME ZONE,
    next_scheduled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Queue Table (for async email sending)
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
    report_id UUID REFERENCES repository_reports(id) ON DELETE SET NULL,
    to_emails TEXT[] NOT NULL,
    cc_emails TEXT[] DEFAULT '{}',
    bcc_emails TEXT[] DEFAULT '{}',
    subject VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    priority INTEGER DEFAULT 5, -- 1-10, higher is more priority
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'retry')),
    attempts INTEGER DEFAULT 0,
    error_message TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
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

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_settings_updated_at BEFORE UPDATE ON email_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_repository_reports_updated_at BEFORE UPDATE ON repository_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_schedules_updated_at BEFORE UPDATE ON email_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_queue_updated_at BEFORE UPDATE ON email_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE repository_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Policies for email_settings
CREATE POLICY "Users can view their own email settings" ON email_settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own email settings" ON email_settings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own email settings" ON email_settings FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own email settings" ON email_settings FOR DELETE USING (user_id = auth.uid());

-- Policies for email_templates
CREATE POLICY "Users can view their own email templates" ON email_templates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own email templates" ON email_templates FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own email templates" ON email_templates FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own email templates" ON email_templates FOR DELETE USING (user_id = auth.uid());

-- Policies for repository_reports
CREATE POLICY "Users can view their own repository reports" ON repository_reports FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own repository reports" ON repository_reports FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own repository reports" ON repository_reports FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own repository reports" ON repository_reports FOR DELETE USING (user_id = auth.uid());

-- Policies for email_schedules
CREATE POLICY "Users can view their own email schedules" ON email_schedules FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own email schedules" ON email_schedules FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own email schedules" ON email_schedules FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own email schedules" ON email_schedules FOR DELETE USING (user_id = auth.uid());

-- Policies for email_queue
CREATE POLICY "Users can view their own email queue" ON email_queue FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own email queue" ON email_queue FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own email queue" ON email_queue FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own email queue" ON email_queue FOR DELETE USING (user_id = auth.uid());

-- Insert default email templates
INSERT INTO email_templates (user_id, name, type, subject, html_content, text_content, variables) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000'::UUID, -- Single user ID
    'Repository Weekly Report',
    'repository_report',
    '📊 Weekly Report for {{repository_name}}',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{repository_name}} Weekly Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, {{primary_color}}, #6366f1); padding: 40px 20px; text-align: center; }
        .logo { max-width: 150px; height: auto; margin-bottom: 20px; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 20px; }
        .metric-card { background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid {{primary_color}}; }
        .metric-title { font-weight: 600; color: #374151; margin-bottom: 8px; }
        .metric-value { font-size: 24px; font-weight: 700; color: {{primary_color}}; }
        .footer { background: #374151; color: white; padding: 20px; text-align: center; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="{{logo_url}}" alt="{{company_name}}" class="logo">
            <h1>Repository Report</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 0;">{{repository_name}} • {{period_start}} - {{period_end}}</p>
        </div>
        
        <div class="content">
            <h2>📈 Activity Summary</h2>
            <div class="metric-card">
                <div class="metric-title">Commits This Week</div>
                <div class="metric-value">{{commit_count}}</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Issues Resolved</div>
                <div class="metric-value">{{issues_resolved}}</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Pull Requests Merged</div>
                <div class="metric-value">{{prs_merged}}</div>
            </div>
            
            <h2>🔍 Key Highlights</h2>
            <div style="background: #fef3c7; border-radius: 8px; padding: 20px; border-left: 4px solid #f59e0b;">
                {{summary}}
            </div>
            
            <h2>📋 Recommendations</h2>
            <ul style="padding-left: 20px;">
                {{#each recommendations}}
                <li style="margin-bottom: 8px;">{{this}}</li>
                {{/each}}
            </ul>
        </div>
        
        <div class="footer">
            <p>Generated by {{company_name}} • Powered by GitHub Helper</p>
        </div>
    </div>
</body>
</html>',
    'Repository Weekly Report for {{repository_name}}

Activity Summary:
- Commits: {{commit_count}}
- Issues Resolved: {{issues_resolved}}
- Pull Requests Merged: {{prs_merged}}

Key Highlights:
{{summary}}

Recommendations:
{{#each recommendations}}
- {{this}}
{{/each}}

Generated by {{company_name}}
Powered by GitHub Helper',
    ARRAY['repository_name', 'period_start', 'period_end', 'commit_count', 'issues_resolved', 'prs_merged', 'summary', 'recommendations', 'company_name', 'logo_url', 'primary_color']
) ON CONFLICT DO NOTHING;

-- Create a function to get next scheduled run time
CREATE OR REPLACE FUNCTION calculate_next_run(schedule_config JSONB, schedule_type VARCHAR)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    next_run TIMESTAMP WITH TIME ZONE;
    hour_val INTEGER;
    minute_val INTEGER;
    day_of_week_val INTEGER;
    day_of_month_val INTEGER;
BEGIN
    hour_val := COALESCE((schedule_config->>'hour')::INTEGER, 9);
    minute_val := COALESCE((schedule_config->>'minute')::INTEGER, 0);
    
    CASE schedule_type
        WHEN 'daily' THEN
            next_run := date_trunc('day', NOW() + INTERVAL '1 day') + 
                       make_interval(hours := hour_val, mins := minute_val);
        WHEN 'weekly' THEN
            day_of_week_val := COALESCE((schedule_config->>'day_of_week')::INTEGER, 1); -- Monday
            next_run := date_trunc('week', NOW()) + 
                       make_interval(days := day_of_week_val, hours := hour_val, mins := minute_val);
            IF next_run <= NOW() THEN
                next_run := next_run + INTERVAL '1 week';
            END IF;
        WHEN 'monthly' THEN
            day_of_month_val := COALESCE((schedule_config->>'day_of_month')::INTEGER, 1);
            next_run := date_trunc('month', NOW()) + 
                       make_interval(days := day_of_month_val - 1, hours := hour_val, mins := minute_val);
            IF next_run <= NOW() THEN
                next_run := next_run + INTERVAL '1 month';
            END IF;
        ELSE
            next_run := NOW() + INTERVAL '1 day';
    END CASE;
    
    RETURN next_run;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE email_settings IS 'SMTP configuration and branding settings for email notifications';
COMMENT ON TABLE email_templates IS 'HTML and text templates for different types of email notifications';
COMMENT ON TABLE repository_reports IS 'Generated reports containing repository analysis and metrics';
COMMENT ON TABLE email_schedules IS 'Scheduling configuration for automated email reports';
COMMENT ON TABLE email_queue IS 'Queue for outgoing emails with retry logic and status tracking';

COMMENT ON COLUMN email_settings.smtp_password IS 'Encrypted SMTP password - should be encrypted before storage';
COMMENT ON COLUMN email_templates.variables IS 'Array of template variable names used in the HTML/text content';
COMMENT ON COLUMN repository_reports.commit_summary IS 'JSON array of commit statistics by author';
COMMENT ON COLUMN repository_reports.issue_summary IS 'JSON object containing issue metrics and trends';
COMMENT ON COLUMN repository_reports.pull_request_summary IS 'JSON object containing PR metrics and contributor stats';
COMMENT ON COLUMN repository_reports.performance_metrics IS 'JSON object with build, test, and quality metrics';
COMMENT ON COLUMN email_schedules.schedule_config IS 'JSON configuration for schedule timing (day_of_week, hour, minute, etc.)';
COMMENT ON COLUMN email_queue.priority IS 'Email priority (1-10, higher number = higher priority)';
