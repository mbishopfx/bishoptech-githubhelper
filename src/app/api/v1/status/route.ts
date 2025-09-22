import { NextRequest } from 'next/server';
import { createApiResponse } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/v1/status - API health and status check
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();

    // Check database connection
    let dbStatus = 'unknown';
    let dbLatency = 0;
    try {
      const dbStart = Date.now();
      const { error } = await supabase.from('repositories').select('id').limit(1);
      dbLatency = Date.now() - dbStart;
      dbStatus = error ? 'error' : 'healthy';
    } catch (dbError) {
      dbStatus = 'error';
    }

    // Check OpenAI availability (simple check)
    let aiStatus = 'healthy';
    if (!process.env.OPENAI_API_KEY) {
      aiStatus = 'not_configured';
    }

    // Check GitHub API availability
    let githubStatus = 'healthy';
    if (!process.env.GITHUB_TOKEN) {
      githubStatus = 'not_configured';
    }

    const responseTime = Date.now() - startTime;

    const status = {
      api: {
        status: 'healthy',
        version: '1.0',
        uptime: process.uptime(),
        response_time: responseTime,
        timestamp: new Date().toISOString()
      },
      services: {
        database: {
          status: dbStatus,
          latency: dbLatency,
          provider: 'supabase'
        },
        ai: {
          status: aiStatus,
          provider: 'openai',
          model: 'gpt-4o'
        },
        github: {
          status: githubStatus,
          provider: 'github_api'
        }
      },
      features: {
        projects: true,
        todos: true,
        recaps: true,
        ai_chat: aiStatus === 'healthy',
        github_analysis: githubStatus === 'healthy',
        streaming: true,
        webhooks: true
      },
      rate_limits: {
        requests_per_day: 1000,
        requests_per_hour: 100,
        ai_requests_per_day: 500
      }
    };

    return createApiResponse(status);
  } catch (error) {
    console.error('Status check error:', error);
    return createApiResponse({
      api: {
        status: 'error',
        version: '1.0',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      }
    }, 503);
  }
}
