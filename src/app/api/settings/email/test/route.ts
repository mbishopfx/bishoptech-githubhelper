import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { host, port, secure, auth } = body;

    // Validate required fields
    if (!host || !port || !auth?.user || !auth?.pass) {
      return NextResponse.json(
        { success: false, error: 'Missing required SMTP configuration' },
        { status: 400 }
      );
    }

    // Create a temporary email service instance for testing
    const nodemailer = await import('nodemailer');
    const testTransporter = nodemailer.createTransporter({
      host,
      port,
      secure,
      auth: {
        user: auth.user,
        pass: auth.pass,
      },
    });

    // Test the connection
    await testTransporter.verify();

    return NextResponse.json({
      success: true,
      message: 'SMTP connection successful!'
    });
  } catch (error: any) {
    console.error('SMTP connection test failed:', error);
    
    let errorMessage = 'Connection failed';
    
    // Provide more specific error messages
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Please check your email and password.';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'SMTP server not found. Please check the host address.';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused. Please check the port and security settings.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 }
    );
  }
}
