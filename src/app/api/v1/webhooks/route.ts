import { NextRequest } from 'next/server';
import { withApiAuth, createApiResponse, createApiError } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface WebhookPayload {
  event: string;
  project_id?: string;
  data: any;
  timestamp: string;
  source?: string;
}

/**
 * POST /api/v1/webhooks - Register webhook endpoints for notifications
 */
export const POST = withApiAuth(async (request: NextRequest, context: any, auth: any) => {
  try {
    const { 
      url,
      events = [],
      secret,
      project_id,
      active = true
    } = await request.json();

    if (!url) {
      return createApiError('webhook url is required', 400, 'MISSING_URL');
    }

    if (!Array.isArray(events) || events.length === 0) {
      return createApiError('events array is required and must not be empty', 400, 'MISSING_EVENTS');
    }

    // Available webhook events
    const availableEvents = [
      'project.created',
      'project.updated',
      'project.analyzed',
      'todo.created',
      'todo.updated',
      'todo.completed',
      'recap.generated',
      'ai.chat.completed',
      'analysis.completed'
    ];

    const invalidEvents = events.filter((event: string) => !availableEvents.includes(event));
    if (invalidEvents.length > 0) {
      return createApiError(
        `Invalid events: ${invalidEvents.join(', ')}. Available: ${availableEvents.join(', ')}`,
        400,
        'INVALID_EVENTS'
      );
    }

    // Store webhook configuration (in production, save to database)
    const webhookId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const webhook = {
      id: webhookId,
      user_id: auth.user_id,
      url,
      events,
      secret: secret || null,
      project_id: project_id || null,
      active,
      created_at: new Date().toISOString()
    };

    // In production, save to webhooks table
    // For demo, just return the webhook config
    console.log('Webhook registered:', webhook);

    return createApiResponse({
      webhook,
      message: 'Webhook registered successfully',
      test_payload_example: {
        event: 'project.created',
        project_id: 'proj_123',
        data: {
          name: 'my-awesome-project',
          full_name: 'user/my-awesome-project',
          created_at: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        source: 'github_agent_dashboard'
      }
    }, 201);
  } catch (error) {
    console.error('POST /api/v1/webhooks error:', error);
    return createApiError('Internal server error', 500);
  }
});

/**
 * Helper function to trigger webhooks (used internally by other API endpoints)
 */
export async function triggerWebhook(userId: string, event: string, data: any, projectId?: string) {
  try {
    const payload: WebhookPayload = {
      event,
      project_id: projectId,
      data,
      timestamp: new Date().toISOString(),
      source: 'github_agent_dashboard'
    };

    // In production, fetch webhooks from database and send HTTP requests
    console.log(`Webhook triggered for user ${userId}:`, payload);

    // Example webhook delivery (implement actual HTTP requests in production)
    /*
    const webhooks = await getWebhooksForUser(userId, event, projectId);
    
    for (const webhook of webhooks) {
      try {
        await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'GitHub-Agent-Dashboard/1.0',
            ...(webhook.secret ? { 'X-Hub-Signature-256': generateSignature(payload, webhook.secret) } : {})
          },
          body: JSON.stringify(payload)
        });
      } catch (deliveryError) {
        console.error(`Webhook delivery failed for ${webhook.url}:`, deliveryError);
      }
    }
    */
    
    return true;
  } catch (error) {
    console.error('Webhook trigger error:', error);
    return false;
  }
}
