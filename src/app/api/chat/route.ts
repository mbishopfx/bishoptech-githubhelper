import { NextRequest, NextResponse } from 'next/server';
import { chatAssistantGraph } from '@/lib/agents/graphs/chat-assistant';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, repositoryId, conversationId, userId } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Execute the chat assistant graph
    const result = await chatAssistantGraph.execute({
      message,
      repositoryId,
      conversationId,
      userId,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        response: result.response,
        conversation_id: result.conversation_id,
        execution_time: result.execution_time,
        steps: result.steps,
      });
    } else {
      return NextResponse.json(
        { 
          error: 'Chat processing failed', 
          details: result.error,
          response: result.response, // Still return fallback response
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        response: 'I apologize, but I encountered an error. Please try again.',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
