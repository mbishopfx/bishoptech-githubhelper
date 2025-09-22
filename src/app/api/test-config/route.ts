import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export async function GET(request: NextRequest) {
  const results = {
    timestamp: new Date().toISOString(),
    status: 'ok',
    checks: {
      environment: { status: 'unknown', details: {} },
      supabase: { status: 'unknown', details: {} },
      openai: { status: 'unknown', details: {} },
    }
  };

  try {
    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY',
      'NEXTAUTH_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    results.checks.environment = {
      status: missingVars.length === 0 ? 'success' : 'warning',
      details: {
        required: requiredEnvVars.length,
        present: requiredEnvVars.length - missingVars.length,
        missing: missingVars,
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗',
        openai_key: process.env.OPENAI_API_KEY ? '✓' : '✗',
      }
    };

    // Test Supabase connection
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Test connection with a simple query
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(5);

      if (error) {
        results.checks.supabase = {
          status: 'error',
          details: { 
            message: error.message,
            code: error.code 
          }
        };
      } else {
        results.checks.supabase = {
          status: 'success',
          details: {
            connected: true,
            tables_found: data?.length || 0,
            sample_tables: data?.map(t => t.table_name) || []
          }
        };
      }
    } catch (supabaseError) {
      results.checks.supabase = {
        status: 'error',
        details: { 
          message: (supabaseError as Error).message 
        }
      };
    }

    // Test OpenAI connection
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY!,
      });

      // Test with a simple completion
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "Connection test successful" in exactly those words.' }
        ],
        max_tokens: 10,
        temperature: 0
      });

      const response = completion.choices[0]?.message?.content || '';
      
      results.checks.openai = {
        status: 'success',
        details: {
          connected: true,
          model: 'gpt-4o',
          response: response.trim(),
          usage: completion.usage
        }
      };
    } catch (openaiError: any) {
      results.checks.openai = {
        status: 'error',
        details: { 
          message: openaiError.message,
          type: openaiError.type || 'unknown',
          code: openaiError.status || 'unknown'
        }
      };
    }

    // Overall status
    const allSuccessful = Object.values(results.checks).every(check => check.status === 'success');
    const hasErrors = Object.values(results.checks).some(check => check.status === 'error');
    
    results.status = allSuccessful ? 'success' : hasErrors ? 'error' : 'warning';

    return NextResponse.json(results, {
      status: hasErrors ? 500 : 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: {
        message: (error as Error).message,
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
      },
      checks: results.checks
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
}
