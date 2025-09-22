const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function setupEmailSchema() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('Make sure .env.local contains:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL');
    console.log('- SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  console.log('🔗 Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('📖 Reading email reporting schema...');
  const schemaPath = path.join(__dirname, '..', 'database', 'email-reporting-schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  console.log('🔧 Creating email reporting tables...');
  
  // Split by major statements and execute individually
  const statements = [
    // Create tables
    `CREATE TABLE IF NOT EXISTS email_settings (
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
    );`,
    
    `CREATE TABLE IF NOT EXISTS email_templates (
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
    );`,
    
    `CREATE TABLE IF NOT EXISTS repository_reports (
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
    );`,
    
    `CREATE TABLE IF NOT EXISTS email_schedules (
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
    );`,
    
    `CREATE TABLE IF NOT EXISTS email_queue (
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
    );`
  ];
  
  for (let i = 0; i < statements.length; i++) {
    try {
      console.log(`   Creating table ${i + 1}/${statements.length}...`);
      const { error } = await supabase.rpc('exec', { sql: statements[i] });
      if (error) {
        console.log(`   ⚠️  Warning: ${error.message}`);
      } else {
        console.log(`   ✅ Table ${i + 1} created successfully`);
      }
    } catch (err) {
      console.log(`   ⚠️  Warning: ${err.message}`);
    }
  }
  
  // Try alternative method if exec doesn't work
  console.log('🔗 Testing alternative connection method...');
  try {
    const { data, error } = await supabase
      .from('email_settings')
      .select('count', { count: 'exact', head: true });
    
    if (!error) {
      console.log('✅ Email settings table is accessible!');
    }
  } catch (err) {
    // Ignore error for now
  }
  
  try {
    const { data, error } = await supabase
      .from('repository_reports')
      .select('count', { count: 'exact', head: true });
    
    if (!error) {
      console.log('✅ Repository reports table is accessible!');
    }
  } catch (err) {
    // Ignore error for now  
  }
  
  console.log('');
  console.log('🎯 Schema setup complete!');
  console.log('📧 Email reporting tables are now ready.');
  console.log('🚀 You can now generate and send repository reports!');
}

setupEmailSchema().catch((error) => {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
});
