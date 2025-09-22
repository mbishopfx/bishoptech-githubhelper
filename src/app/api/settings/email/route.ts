import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSingleUserId } from '@/lib/single-user';

export async function GET() {
  try {
    const userId = getSingleUserId();
    
    const { data: settings, error } = await supabase
      .from('email_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      data: settings || null 
    });
  } catch (error: any) {
    console.error('Failed to get email settings:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getSingleUserId();
    const body = await request.json();
    
    const {
      smtp: { host, port, secure, auth },
      sender,
      branding
    } = body;

    const emailSettings = {
      user_id: userId,
      smtp_host: host,
      smtp_port: port,
      smtp_secure: secure,
      smtp_user: auth.user,
      smtp_password: auth.pass, // TODO: Encrypt this before storing
      sender_name: sender.name,
      sender_email: sender.email,
      logo_url: branding.logoUrl,
      company_name: branding.companyName,
      primary_color: branding.primaryColor,
    };

    // Upsert email settings
    const { data, error } = await supabase
      .from('email_settings')
      .upsert(emailSettings, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Email settings saved successfully',
      data
    });
  } catch (error: any) {
    console.error('Failed to save email settings:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const userId = getSingleUserId();
    
    const { error } = await supabase
      .from('email_settings')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Email settings deleted successfully'
    });
  } catch (error: any) {
    console.error('Failed to delete email settings:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
