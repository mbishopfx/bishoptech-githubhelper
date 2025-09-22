import { NextRequest } from 'next/server';
import { withApiAuth, createApiResponse, createApiError } from '@/lib/api-auth';
import { chatAssistantGraph } from '@/lib/agents/graphs/chat-assistant';

/**
 * POST /api/v1/ai/chat - Chat with AI assistant about projects
 */
export const POST = withApiAuth(async (request: NextRequest, context: any, auth: any) => {
  try {
    const { 
      message, 
      project_id,
      conversation_id,
      context: userContext,
      model = 'gpt-4o',
      temperature = 0.3,
      stream = false
    } = await request.json();

    if (!message) {
      return createApiError('message is required', 400, 'MISSING_MESSAGE');
    }

    // For streaming responses, we'll return a JSON response with a stream indicator
    // In a full implementation, you'd use Server-Sent Events or WebSocket
    if (stream) {
      return createApiError('Streaming not supported in this endpoint. Use /api/chat/stream for streaming responses.', 400, 'STREAMING_NOT_SUPPORTED');
    }

    // Execute chat assistant
    const result = await chatAssistantGraph.execute({
      message,
      repositoryId: project_id,
      conversationId: conversation_id,
      userId: auth.user_id,
      context: userContext
    });

    if (!result.success) {
      return createApiError(
        result.error || 'AI chat processing failed',
        500,
        'AI_PROCESSING_ERROR'
      );
    }

    return createApiResponse({
      response: result.response,
      conversation_id: result.conversation_id,
      execution_time: result.execution_time,
      steps: result.steps,
      model_used: model,
      temperature_used: temperature
    });
  } catch (error) {
    console.error('POST /api/v1/ai/chat error:', error);
    return createApiError('Internal server error', 500);
  }
});
