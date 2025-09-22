#!/usr/bin/env node
/**
 * Targeted script to add specific missing columns
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function main() {
  log('\n🔧 Adding Missing Database Columns\n', colors.blue);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    log('✅ Connected to database', colors.green);

    // Add missing columns one by one
    const columnFixes = [
      {
        table: 'todo_items',
        column: 'status',
        type: 'VARCHAR(50)',
        default: "'pending'"
      },
      {
        table: 'todo_items',
        column: 'priority',
        type: 'VARCHAR(50)', 
        default: "'medium'"
      },
      {
        table: 'todo_items',
        column: 'assigned_to',
        type: 'UUID',
        default: null
      },
      {
        table: 'todo_items',
        column: 'due_date',
        type: 'TIMESTAMP WITH TIME ZONE',
        default: null
      },
      {
        table: 'recaps',
        column: 'action_items',
        type: 'TEXT[]',
        default: "ARRAY[]::TEXT[]"
      },
      {
        table: 'recaps',
        column: 'key_updates',
        type: 'TEXT[]',
        default: "ARRAY[]::TEXT[]"
      },
      {
        table: 'recaps',
        column: 'metrics',
        type: 'JSONB',
        default: "'{}'"
      },
      {
        table: 'recaps',
        column: 'period',
        type: 'VARCHAR(50)',
        default: null
      },
      {
        table: 'recaps',
        column: 'generated_at',
        type: 'TIMESTAMP WITH TIME ZONE',
        default: 'NOW()'
      }
    ];

    for (const fix of columnFixes) {
      try {
        // Check if column exists
        const checkResult = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1 AND column_name = $2
        `, [fix.table, fix.column]);

        if (checkResult.rows.length === 0) {
          // Column doesn't exist, add it
          const defaultClause = fix.default ? `DEFAULT ${fix.default}` : '';
          const sql = `ALTER TABLE ${fix.table} ADD COLUMN ${fix.column} ${fix.type} ${defaultClause}`;
          
          await client.query(sql);
          log(`✅ Added ${fix.table}.${fix.column}`, colors.green);
        } else {
          log(`ℹ️  Column ${fix.table}.${fix.column} already exists`, colors.blue);
        }
      } catch (error) {
        log(`❌ Error adding ${fix.table}.${fix.column}: ${error.message}`, colors.red);
      }
    }

    // Test the columns
    log('\n🧪 Testing columns...', colors.blue);
    
    try {
      await client.query('SELECT status FROM todo_items LIMIT 1');
      log('✅ todo_items.status is working', colors.green);
    } catch (error) {
      log(`❌ todo_items.status still missing: ${error.message}`, colors.red);
    }

    try {
      await client.query('SELECT action_items FROM recaps LIMIT 1');
      log('✅ recaps.action_items is working', colors.green);
    } catch (error) {
      log(`❌ recaps.action_items still missing: ${error.message}`, colors.red);
    }

    log('\n🎉 Column fix completed!', colors.green);

  } catch (error) {
    log(`❌ Script failed: ${error.message}`, colors.red);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
