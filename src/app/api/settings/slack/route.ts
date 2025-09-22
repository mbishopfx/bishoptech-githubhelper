import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';

interface SlackSettings {
  id?: string;
  user_id: string;
  bot_name: string;
  app_name: string;
  description: string;
  webhook_url?: string;
  bot_token?: string;
  signing_secret?: string;
  client_id?: string;
  client_secret?: string;
  verification_token?: string;
  features: {
    chat_commands: boolean;
    repo_updates: boolean;
    todo_notifications: boolean;
    meeting_recaps: boolean;
    direct_messages: boolean;
  };
  scopes: string[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Encrypt sensitive data (in production, use proper encryption)
function encryptSensitiveData(data: string): string {
  // TODO: Implement proper encryption in production
  // For now, just base64 encode (NOT secure for production)
  return Buffer.from(data).toString('base64');
}

// Decrypt sensitive data
function decryptSensitiveData(encryptedData: string): string {
  // TODO: Implement proper decryption in production
  try {
    return Buffer.from(encryptedData, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get Slack settings from database
    const { data: settings, error } = await db.supabase
      .from('slack_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({
        success: true,
        data: {
          bot_name: 'GitHub Agent Bot',
          app_name: 'GitHub Agent Dashboard',
          description: 'AI-powered GitHub repository assistant for Slack',
          features: {
            chat_commands: true,
            repo_updates: true,
            todo_notifications: true,
            meeting_recaps: true,
            direct_messages: true,
          },
          scopes: [
            'channels:read',
            'chat:write',
            'commands',
            'im:write',
            'users:read',
            'app_mentions:read'
          ],
          is_active: false,
        }
      });
    }

    // Decrypt sensitive fields for display (but don't return actual values for security)
    const responseData = {
      ...settings,
      bot_token: settings.bot_token ? '***' + settings.bot_token.slice(-4) : '',
      signing_secret: settings.signing_secret ? '***' + settings.signing_secret.slice(-4) : '',
      client_secret: settings.client_secret ? '***' + settings.client_secret.slice(-4) : '',
      verification_token: settings.verification_token ? '***' + settings.verification_token.slice(-4) : '',
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Get Slack settings error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      botName,
      appName,
      description,
      features,
      scopes,
      botToken,
      signingSecret,
      clientId,
      clientSecret,
      verificationToken,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prepare settings data
    const settingsData: Partial<SlackSettings> = {
      user_id: userId,
      bot_name: botName || 'GitHub Agent Bot',
      app_name: appName || 'GitHub Agent Dashboard',
      description: description || 'AI-powered GitHub repository assistant for Slack',
      features: features || {
        chat_commands: true,
        repo_updates: true,
        todo_notifications: true,
        meeting_recaps: true,
        direct_messages: true,
      },
      scopes: scopes || [
        'channels:read',
        'chat:write',
        'commands',
        'im:write', 
        'users:read',
        'app_mentions:read'
      ],
      is_active: !!(botToken && signingSecret), // Only active if required credentials are provided
      webhook_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/slack/events`,
    };

    // Encrypt sensitive fields if provided
    if (botToken && botToken !== '' && !botToken.startsWith('***')) {
      settingsData.bot_token = encryptSensitiveData(botToken);
    }
    if (signingSecret && signingSecret !== '' && !signingSecret.startsWith('***')) {
      settingsData.signing_secret = encryptSensitiveData(signingSecret);
    }
    if (clientId && clientId !== '' && !clientId.startsWith('***')) {
      settingsData.client_id = clientId; // Client ID is not sensitive
    }
    if (clientSecret && clientSecret !== '' && !clientSecret.startsWith('***')) {
      settingsData.client_secret = encryptSensitiveData(clientSecret);
    }
    if (verificationToken && verificationToken !== '' && !verificationToken.startsWith('***')) {
      settingsData.verification_token = encryptSensitiveData(verificationToken);
    }

    // Check if settings already exist
    const { data: existing } = await db.supabase
      .from('slack_settings')
      .select('id')
      .eq('user_id', userId)
      .single();

    let result;
    if (existing) {
      // Update existing settings
      result = await db.supabase
        .from('slack_settings')
        .update({
          ...settingsData,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();
    } else {
      // Create new settings
      result = await db.supabase
        .from('slack_settings')
        .insert({
          ...settingsData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Database error:', result.error);
      return NextResponse.json(
        { error: 'Failed to save settings' },
        { status: 500 }
      );
    }

    // Also update environment variables for immediate use
    if (settingsData.bot_token) {
      process.env.SLACK_BOT_TOKEN = decryptSensitiveData(settingsData.bot_token);
    }
    if (settingsData.signing_secret) {
      process.env.SLACK_SIGNING_SECRET = decryptSensitiveData(settingsData.signing_secret);
    }

    return NextResponse.json({
      success: true,
      message: 'Slack settings saved successfully',
      data: {
        id: result.data.id,
        is_active: result.data.is_active,
        webhook_url: result.data.webhook_url,
      },
    });
  } catch (error) {
    console.error('Save Slack settings error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Delete Slack settings
    const { error } = await db.supabase
      .from('slack_settings')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to delete settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Slack settings deleted successfully',
    });
  } catch (error) {
    console.error('Delete Slack settings error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
