import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { chatAssistantGraph } from '@/lib/agents/graphs/chat-assistant';
import { repoAnalyzerGraph } from '@/lib/agents/graphs/repo-analyzer';

// Slack signature verification
function verifySlackSignature(
  body: string,
  signature: string,
  timestamp: string,
  signingSecret: string
): boolean {
  const hmac = crypto.createHmac('sha256', signingSecret);
  const [version, hash] = signature.split('=');
  
  hmac.update(`${version}:${timestamp}:${body}`);
  const expectedHash = hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(expectedHash, 'hex')
  );
}

// Handle Slack URL verification challenge
function handleUrlVerification(body: any): NextResponse {
  if (body.type === 'url_verification') {
    return NextResponse.json({ challenge: body.challenge });
  }
  return NextResponse.json({ error: 'Invalid verification request' }, { status: 400 });
}

// Handle app mentions (@bot_name message)
async function handleAppMention(event: any): Promise<any> {
  const { text, channel, user, ts } = event;
  
  // Remove bot mention from text
  const cleanText = text.replace(/<@[UW][A-Z0-9]+>/g, '').trim();
  
  try {
    // Check if it's a repository-related query
    const repoMatch = cleanText.match(/(?:repo|repository):\s*([^\s]+)/i);
    const repositoryName = repoMatch?.[1];

    let response = '';
    
    if (repositoryName) {
      // Repository-specific query
      const result = await chatAssistantGraph.execute({
        message: cleanText,
        repositoryName,
        userId: user,
        channel,
      });
      
      response = result.response || 'I encountered an issue processing your repository query.';
    } else if (cleanText.toLowerCase().includes('analyze') || cleanText.toLowerCase().includes('analysis')) {
      // General analysis request
      response = `To analyze a repository, please specify it like this: \`repo:owner/repository-name\`
      
For example: \`@github-agent analyze repo:facebook/react\``;
    } else {
      // General chat
      const result = await chatAssistantGraph.execute({
        message: cleanText,
        userId: user,
        channel,
      });
      
      response = result.response || 'How can I help you with your GitHub repositories today?';
    }

    return {
      channel,
      text: response,
      thread_ts: ts, // Reply in thread
    };
  } catch (error) {
    console.error('App mention error:', error);
    return {
      channel,
      text: 'I apologize, but I encountered an error processing your request. Please try again later.',
      thread_ts: ts,
    };
  }
}

// Handle direct messages to the bot
async function handleDirectMessage(event: any): Promise<any> {
  const { text, channel, user, ts } = event;
  
  try {
    const result = await chatAssistantGraph.execute({
      message: text,
      userId: user,
      channel,
    });
    
    return {
      channel,
      text: result.response || 'I apologize, but I encountered an issue. Please try again.',
    };
  } catch (error) {
    console.error('Direct message error:', error);
    return {
      channel,
      text: 'I encountered an error processing your message. Please try again later.',
    };
  }
}

// Handle slash commands
async function handleSlashCommand(command: string, body: any): Promise<any> {
  const { text, user_id, channel_id, response_url } = body;
  
  try {
    switch (command) {
      case '/repo-analyze': {
        if (!text.trim()) {
          return {
            response_type: 'ephemeral',
            text: 'Please provide a repository URL or name. Example: `/repo-analyze owner/repository-name`',
          };
        }
        
        // Start analysis (this might take time, so we'll respond immediately and update later)
        const analysisResult = await repoAnalyzerGraph.execute({
          github_url: text.includes('github.com') ? text : `https://github.com/${text}`,
          userId: user_id,
        });
        
        if (analysisResult.success) {
          return {
            response_type: 'in_channel',
            text: `🔍 Analysis complete for \`${text}\`:`,
            attachments: [{
              color: 'good',
              fields: [
                {
                  title: 'Repository Analysis',
                  value: analysisResult.results?.comprehensive_summary?.substring(0, 500) + '...' || 'Analysis completed successfully',
                  short: false
                }
              ]
            }]
          };
        } else {
          return {
            response_type: 'ephemeral',
            text: `❌ Analysis failed: ${analysisResult.error}`,
          };
        }
      }
      
      case '/repo-todo': {
        if (!text.trim()) {
          return {
            response_type: 'ephemeral',
            text: 'Please provide a repository name. Example: `/repo-todo owner/repository-name`',
          };
        }
        
        // TODO: Implement todo generation
        return {
          response_type: 'ephemeral',
          text: '📝 Todo generation feature is coming soon!',
        };
      }
      
      case '/repo-recap': {
        if (!text.trim()) {
          return {
            response_type: 'ephemeral',
            text: 'Please provide a repository name and optional date range. Example: `/repo-recap owner/repository-name last week`',
          };
        }
        
        // TODO: Implement recap generation
        return {
          response_type: 'ephemeral',
          text: '📊 Recap generation feature is coming soon!',
        };
      }
      
      case '/repo-chat': {
        if (!text.trim()) {
          return {
            response_type: 'ephemeral',
            text: 'Please provide a repository name and question. Example: `/repo-chat owner/repository-name What is the main technology stack?`',
          };
        }
        
        const [repoName, ...questionParts] = text.split(' ');
        const question = questionParts.join(' ');
        
        if (!question) {
          return {
            response_type: 'ephemeral',
            text: 'Please provide a question about the repository.',
          };
        }
        
        const result = await chatAssistantGraph.execute({
          message: question,
          repositoryName: repoName,
          userId: user_id,
          channel: channel_id,
        });
        
        return {
          response_type: 'in_channel',
          text: `💬 Question about \`${repoName}\`: ${question}`,
          attachments: [{
            color: '#3b82f6',
            text: result.response || 'I encountered an issue answering your question.',
          }]
        };
      }
      
      default:
        return {
          response_type: 'ephemeral',
          text: 'Unknown command. Available commands: `/repo-analyze`, `/repo-todo`, `/repo-recap`, `/repo-chat`',
        };
    }
  } catch (error) {
    console.error('Slash command error:', error);
    return {
      response_type: 'ephemeral',
      text: 'I encountered an error processing your command. Please try again later.',
    };
  }
}

// Send message to Slack
async function sendSlackMessage(token: string, messageData: any): Promise<void> {
  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    });
    
    const result = await response.json();
    
    if (!result.ok) {
      console.error('Slack API error:', result.error);
    }
  } catch (error) {
    console.error('Failed to send Slack message:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    // Handle URL-encoded form data (slash commands) vs JSON (events)
    let parsedBody: any;
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      // Slash command
      parsedBody = Object.fromEntries(new URLSearchParams(body));
      
      // Extract command from the payload
      const command = parsedBody.command;
      const response = await handleSlashCommand(command, parsedBody);
      
      return NextResponse.json(response);
    } else {
      // Event or other JSON payload
      parsedBody = JSON.parse(body);
    }

    // Handle URL verification challenge
    if (parsedBody.type === 'url_verification') {
      return handleUrlVerification(parsedBody);
    }

    // Get signing secret from environment or database
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    if (!signingSecret) {
      console.error('Slack signing secret not configured');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    // Verify Slack signature for security
    const signature = request.headers.get('x-slack-signature');
    const timestamp = request.headers.get('x-slack-request-timestamp');
    
    if (signature && timestamp) {
      const isValid = verifySlackSignature(body, signature, timestamp, signingSecret);
      if (!isValid) {
        console.error('Invalid Slack signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Handle events
    if (parsedBody.type === 'event_callback') {
      const { event } = parsedBody;
      let messageResponse: any = null;

      switch (event.type) {
        case 'app_mention':
          messageResponse = await handleAppMention(event);
          break;
          
        case 'message':
          // Only handle direct messages (not channel messages)
          if (event.channel_type === 'im') {
            messageResponse = await handleDirectMessage(event);
          }
          break;
          
        default:
          console.log('Unhandled event type:', event.type);
      }

      // Send response message if needed
      if (messageResponse) {
        const botToken = process.env.SLACK_BOT_TOKEN;
        if (botToken) {
          await sendSlackMessage(botToken, messageResponse);
        }
      }
    }

    // Always return 200 OK to Slack to acknowledge receipt
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error('Slack webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json({
    status: 'GitHub Agent Dashboard Slack Webhook',
    timestamp: new Date().toISOString(),
    endpoints: {
      events: 'POST /api/slack/events',
      commands: 'POST /api/slack/events (form-encoded)',
    },
    available_commands: [
      '/repo-analyze [repository-url]',
      '/repo-todo [repository-name]', 
      '/repo-recap [repository-name] [date-range]',
      '/repo-chat [repository-name] [question]'
    ]
  });
}
