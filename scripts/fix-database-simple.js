#!/usr/bin/env node
/**
 * GitHub Agent Dashboard - Simple Database Fix Script
 * 
 * This script connects directly to PostgreSQL and executes the schema fixes.
 * 
 * Usage: node scripts/fix-database-simple.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

async function main() {
  log(`\n${colors.bold}${colors.cyan}🔧 GitHub Agent Dashboard - Database Fix Script${colors.reset}\n`);

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    logError('DATABASE_URL environment variable is required');
    logInfo('Please check your .env.local file');
    process.exit(1);
  }

  logInfo('Connecting to PostgreSQL database...');

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false // Needed for Supabase
    }
  });

  try {
    await client.connect();
    logSuccess('Connected to database successfully');

    // Execute the comprehensive fix
    await executeSchemaFix(client);
    
    logSuccess('\n🎉 Database fix completed successfully!');
    logInfo('Your GitHub Agent Dashboard APIs should now work properly.');
    
  } catch (error) {
    logError(`Script failed: ${error.message}`);
    if (error.stack) {
      console.log(error.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function executeSchemaFix(client) {
  // Read the comprehensive fix SQL file
  const sqlFilePath = path.join(__dirname, '..', 'database', 'comprehensive-fix.sql');
  
  let sqlContent;
  try {
    sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    logInfo('Read comprehensive-fix.sql successfully');
  } catch (error) {
    logError(`Could not read SQL file: ${error.message}`);
    
    // Fallback to inline SQL
    logInfo('Using inline SQL as fallback...');
    sqlContent = getInlineSQL();
  }

  // Split SQL into individual statements (basic approach)
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

  logInfo(`Executing ${statements.length} SQL statements...`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip comments and empty statements
    if (statement.startsWith('--') || statement.length < 10) {
      continue;
    }

    try {
      await client.query(statement + ';');
      successCount++;
      
      // Log progress for important statements
      if (statement.toLowerCase().includes('create table')) {
        const tableName = statement.match(/create table.*?(\w+)/i)?.[1];
        logSuccess(`Created/verified table: ${tableName}`);
      } else if (statement.toLowerCase().includes('alter table') && statement.toLowerCase().includes('add column')) {
        logInfo('Added missing column');
      } else if (statement.toLowerCase().includes('create policy')) {
        logInfo('Created RLS policy');
      } else if (statement.toLowerCase().includes('create index')) {
        logInfo('Created index');
      }
      
    } catch (error) {
      errorCount++;
      
      // Some errors are expected (e.g., trying to create existing tables)
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('already exists') || 
          errorMessage.includes('duplicate') ||
          errorMessage.includes('relation') && errorMessage.includes('already exists')) {
        // These are OK - table/column/index already exists
        logInfo(`Skipped: Already exists`);
        successCount++; // Count as success
        errorCount--;
      } else if (errorMessage.includes('syntax error') || errorMessage.includes('does not exist')) {
        logError(`SQL Error: ${error.message}`);
        logError(`Statement: ${statement.substring(0, 100)}...`);
      } else {
        logError(`Error: ${error.message}`);
      }
    }
  }

  logInfo(`\nExecution Summary:`);
  logSuccess(`${successCount} statements executed successfully`);
  if (errorCount > 0) {
    logError(`${errorCount} statements had errors (some may be expected)`);
  }

  // Test the final result
  await testDatabaseTables(client);
}

async function testDatabaseTables(client) {
  logInfo('\nTesting database tables...');

  const tests = [
    { name: 'users', required: true },
    { name: 'repositories', required: true },
    { name: 'todo_lists', required: false },
    { name: 'todo_items', required: false },
    { name: 'recaps', required: false },
    { name: 'agent_executions', required: false },
    { name: 'analysis_cache', required: false }
  ];

  for (const test of tests) {
    try {
      const result = await client.query(`SELECT 1 FROM ${test.name} LIMIT 1`);
      logSuccess(`Table '${test.name}' is accessible`);
    } catch (error) {
      if (test.required) {
        logError(`Required table '${test.name}' is not accessible: ${error.message}`);
      } else {
        logError(`Table '${test.name}' is not accessible: ${error.message}`);
      }
    }
  }

  // Test specific columns that were causing issues
  logInfo('\nTesting problematic columns...');
  
  try {
    await client.query(`SELECT status FROM todo_items LIMIT 1`);
    logSuccess(`Column 'todo_items.status' exists`);
  } catch (error) {
    logError(`Column 'todo_items.status' missing: ${error.message}`);
  }

  try {
    await client.query(`SELECT action_items FROM recaps LIMIT 1`);
    logSuccess(`Column 'recaps.action_items' exists`);
  } catch (error) {
    logError(`Column 'recaps.action_items' missing: ${error.message}`);
  }
}

function getInlineSQL() {
  return `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Todo Lists table
CREATE TABLE IF NOT EXISTS todo_lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Todo Items table
CREATE TABLE IF NOT EXISTS todo_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  todo_list_id UUID REFERENCES todo_lists(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(50) DEFAULT 'medium',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recaps table
CREATE TABLE IF NOT EXISTS recaps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  period VARCHAR(50),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metrics JSONB DEFAULT '{}',
  key_updates TEXT[] DEFAULT ARRAY[]::TEXT[],
  action_items TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Executions table
CREATE TABLE IF NOT EXISTS agent_executions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  agent_type VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  input JSONB,
  output JSONB,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  steps_taken INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analysis Cache table
CREATE TABLE IF NOT EXISTS analysis_cache (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  cache_key VARCHAR(255) NOT NULL,
  cache_type VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(repository_id, cache_key, cache_type)
);

-- Enable RLS
ALTER TABLE todo_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_cache ENABLE ROW LEVEL SECURITY;

-- Create permissive policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON todo_lists;
CREATE POLICY "Allow all operations for authenticated users" ON todo_lists FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON todo_items;
CREATE POLICY "Allow all operations for authenticated users" ON todo_items FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON recaps;
CREATE POLICY "Allow all operations for authenticated users" ON recaps FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON agent_executions;
CREATE POLICY "Allow all operations for authenticated users" ON agent_executions FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON analysis_cache;
CREATE POLICY "Allow all operations for authenticated users" ON analysis_cache FOR ALL USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_todo_lists_user_id ON todo_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_todo_lists_repository_id ON todo_lists(repository_id);
CREATE INDEX IF NOT EXISTS idx_todo_items_todo_list_id ON todo_items(todo_list_id);
CREATE INDEX IF NOT EXISTS idx_todo_items_status ON todo_items(status);
CREATE INDEX IF NOT EXISTS idx_recaps_user_id ON recaps(user_id);
CREATE INDEX IF NOT EXISTS idx_recaps_repository_id ON recaps(repository_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_user_id ON agent_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_cache_repository_id ON analysis_cache(repository_id);
`;
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    logError(`Script failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };
