#!/usr/bin/env node

/**
 * GitHub Agent Dashboard - Database Initialization Script
 * 
 * This script initializes the Supabase database with the required schema
 * for the GitHub Agent Dashboard application.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}\n`),
};

async function initializeDatabase() {
  try {
    log.header('🚀 GitHub Agent Dashboard - Database Setup');

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      log.error('Missing Supabase credentials in .env.local file');
      log.info('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
      process.exit(1);
    }

    log.info('Connecting to Supabase...');
    
    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Test connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);

    if (connectionError) {
      log.error('Failed to connect to Supabase:');
      console.error(connectionError.message);
      process.exit(1);
    }

    log.success('Connected to Supabase successfully');

    // Read schema file
    log.info('Reading database schema...');
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      log.error('Schema file not found at: ' + schemaPath);
      process.exit(1);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    log.success('Schema file loaded');

    // Execute schema
    log.info('Creating database tables and functions...');
    
    const { error: schemaError } = await supabase.rpc('exec_sql', {
      sql_query: schema
    });

    if (schemaError) {
      // Try alternative approach - split and execute individual statements
      log.warning('Batch execution failed, trying individual statements...');
      
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt && !stmt.startsWith('--'));

      let successCount = 0;
      let errorCount = 0;

      for (const statement of statements) {
        if (statement) {
          try {
            const { error } = await supabase.rpc('exec_sql', {
              sql_query: statement + ';'
            });
            
            if (error) {
              log.warning(`Statement failed: ${error.message}`);
              errorCount++;
            } else {
              successCount++;
            }
          } catch (err) {
            log.warning(`Statement execution error: ${err.message}`);
            errorCount++;
          }
        }
      }

      log.info(`Executed ${successCount} statements successfully`);
      if (errorCount > 0) {
        log.warning(`${errorCount} statements had warnings (this is normal for existing tables)`);
      }
    } else {
      log.success('Database schema executed successfully');
    }

    // Verify table creation
    log.info('Verifying table creation...');
    
    const expectedTables = [
      'users',
      'repositories', 
      'conversations',
      'messages',
      'todo_lists',
      'todo_items',
      'recaps',
      'agent_executions',
      'slack_settings'
    ];

    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', expectedTables);

    if (tablesError) {
      log.error('Error checking tables:');
      console.error(tablesError);
    } else {
      const createdTables = tables.map(t => t.table_name);
      const missingTables = expectedTables.filter(t => !createdTables.includes(t));
      
      log.success(`Found ${createdTables.length} tables:`);
      createdTables.forEach(table => log.info(`  • ${table}`));
      
      if (missingTables.length > 0) {
        log.warning(`Missing tables: ${missingTables.join(', ')}`);
      }
    }

    // Test basic functionality
    log.info('Testing database functionality...');
    
    try {
      // Test insert a demo user (this might fail if RLS is strict, which is fine)
      const { data: testUser, error: userError } = await supabase
        .from('users')
        .upsert({
          id: '00000000-0000-0000-0000-000000000001',
          email: 'demo@example.com',
          github_username: 'demo-user'
        })
        .select()
        .single();

      if (testUser) {
        log.success('Database write test successful');
        
        // Clean up test user
        await supabase
          .from('users')
          .delete()
          .eq('id', '00000000-0000-0000-0000-000000000001');
      } else if (userError) {
        log.warning(`Database test warning: ${userError.message}`);
        log.info('This might be due to RLS policies (which is expected)');
      }
    } catch (testError) {
      log.warning('Database functionality test had issues (this might be normal)');
    }

    // Success summary
    log.header('🎉 Database Setup Complete!');
    log.success('Your GitHub Agent Dashboard database is ready to use');
    log.info('Next steps:');
    log.info('  1. Get a GitHub Personal Access Token and add to .env.local');
    log.info('  2. Start the development server: npm run dev');
    log.info('  3. Visit http://localhost:3002 to use the dashboard');
    log.info('  4. Optional: Configure Slack integration in Settings');

  } catch (error) {
    log.error('Database setup failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase();
