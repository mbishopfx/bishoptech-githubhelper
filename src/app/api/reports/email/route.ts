import { NextRequest, NextResponse } from 'next/server';
import { reportGenerator } from '@/lib/report-generator';
import { supabase } from '@/lib/supabase';
import { getSingleUserId } from '@/lib/single-user';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId, recipients, repositoryId, periodStart, periodEnd, customSubject } = body;

    // Validate required fields
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Recipients array is required' },
        { status: 400 }
      );
    }

    let reportData;

    if (reportId && repositoryId) {
      // For now, since database tables don't exist, generate a fresh report
      // In the future, this would fetch from the database
      console.log('📧 Generating fresh report (database not yet set up)');
      
      const startDate = periodStart ? new Date(periodStart) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = periodEnd ? new Date(periodEnd) : new Date();

      reportData = await reportGenerator.generateReport({
        repositoryId,
        periodStart: startDate,
        periodEnd: endDate
      });
    } else if (repositoryId) {
      // Generate new report
      const startDate = periodStart ? new Date(periodStart) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = periodEnd ? new Date(periodEnd) : new Date();

      reportData = await reportGenerator.generateReport({
        repositoryId,
        periodStart: startDate,
        periodEnd: endDate
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'repositoryId is required' },
        { status: 400 }
      );
    }

    // Send the email
    const emailResult = await reportGenerator.emailReport(reportData, recipients, customSubject);

    if (emailResult.success) {
      console.log('📧 Email sent successfully to:', recipients);

      return NextResponse.json({
        success: true,
        message: 'Report emailed successfully',
        data: {
          messageId: emailResult.messageId
        }
      });
    } else {
      throw new Error(emailResult.error || 'Failed to send email');
    }
  } catch (error: any) {
    console.error('Failed to email report:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
