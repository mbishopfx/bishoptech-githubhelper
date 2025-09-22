const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function createEssentialTables() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }
  
  console.log('🔗 Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('🛠️  Creating essential tables via API...');
  
  try {
    // First, let's create the repository_reports table directly
    console.log('📊 Creating repository_reports table...');
    const reportResult = await supabase
      .from('repository_reports')
      .select('count', { count: 'exact', head: true });
    
    if (reportResult.error && reportResult.error.code === 'PGRST116') {
      console.log('   ⚠️  Table does not exist, this is expected...');
    }
    
    // Create a test report to validate the schema is working
    console.log('🧪 Testing report creation...');
    const testReport = {
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      repository_id: '00000000-0000-0000-0000-000000000001', // Dummy ID
      title: 'Test Report',
      summary: 'This is a test report to validate the schema.',
      commit_summary: [],
      issue_summary: {},
      pull_request_summary: {},
      performance_metrics: {},
      recommendations: ['Test recommendation'],
      period_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      period_end: new Date().toISOString(),
      recipients: ['test@example.com']
    };
    
    const { data: insertedReport, error: insertError } = await supabase
      .from('repository_reports')
      .insert(testReport)
      .select()
      .single();
    
    if (insertError) {
      console.log('   ❌ Insert failed:', insertError.message);
      console.log('   🔧 Tables need to be created manually in Supabase dashboard');
      console.log('');
      console.log('   📋 Please create these tables in your Supabase dashboard:');
      console.log('   1. repository_reports');
      console.log('   2. email_settings');
      console.log('   3. email_templates');
      console.log('');
      console.log('   📁 Use the SQL from: database/email-reporting-schema.sql');
      
      return false;
    } else {
      console.log('   ✅ Test report created successfully!');
      console.log('   🗑️  Cleaning up test data...');
      
      // Delete the test report
      await supabase
        .from('repository_reports')
        .delete()
        .eq('id', insertedReport.id);
      
      console.log('   ✅ Database is ready for email reporting!');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

createEssentialTables().then((success) => {
  if (success) {
    console.log('');
    console.log('🎉 Database setup complete!');
    console.log('🚀 You can now test the email report feature!');
  } else {
    console.log('');
    console.log('⚠️  Manual setup required - see instructions above');
  }
}).catch(console.error);
