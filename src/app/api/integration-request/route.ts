import { NextRequest, NextResponse } from 'next/server';
import { createTransporter } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, name, description, userEmail, details, timestamp } = body;

    // Validate required fields
    if (!type || !name || !details) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create email transporter
    const transporter = createTransporter();

    // Send email to matt@bishoptech.dev
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@bishoptech.dev',
      to: 'matt@bishoptech.dev',
      subject: `New Integration Request: ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Integration Request</h2>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #1e293b;">Integration Details</h3>
            <p><strong>Type:</strong> ${type}</p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Requested by:</strong> ${userEmail || 'Anonymous'}</p>
            <p><strong>Submitted:</strong> ${new Date(timestamp).toLocaleString()}</p>
          </div>

          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #1e293b;">What they want implemented:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${details}</p>
          </div>

          ${description ? `
          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #1e293b;">Additional Context:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${description}</p>
          </div>
          ` : ''}

          <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #1d4ed8;">Next Steps</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Review the integration request details</li>
              <li>Assess technical feasibility and priority</li>
              <li>Add to development roadmap if approved</li>
              ${userEmail ? `<li>Follow up with requester at: ${userEmail}</li>` : ''}
            </ul>
          </div>

          <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
            This request was submitted via the GitHub Helper dashboard integration request form.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending integration request email:', error);
    return NextResponse.json(
      { error: 'Failed to send integration request' },
      { status: 500 }
    );
  }
}

