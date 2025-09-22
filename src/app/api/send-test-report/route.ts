import { NextResponse } from 'next/server';
import { reportGenerator } from '@/lib/report-generator';
import { supabase } from '@/lib/supabase';
import { getSingleUserId } from '@/lib/single-user';

export async function POST() {
  try {
    const userId = getSingleUserId();
    
    // Get any repository from the database for testing
    const { data: repositories, error } = await supabase
      .from('repositories')
      .select('*')
      .eq('user_id', userId)
      .limit(1);

    if (error || !repositories || repositories.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No repositories found. Please import some repositories first.' },
        { status: 404 }
      );
    }

    const testRepo = repositories[0];
    console.log(`Generating report for repository: ${testRepo.name}`);

    // Generate comprehensive report for the past 7 days
    const reportData = await reportGenerator.generateReport({
      repositoryId: testRepo.id,
      periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(),
    });

    // Save the report
    const savedReport = await reportGenerator.saveReport(reportData, {
      repositoryId: testRepo.id,
      periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(),
    });

    console.log(`Report saved with ID: ${savedReport.id}`);

    // Email the report to matt@bishoptech.dev
    const emailResult = await reportGenerator.emailReport(reportData, ['matt@bishoptech.dev']);

    if (emailResult.success) {
      // Update the report as emailed
      await supabase
        .from('repository_reports')
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString(),
          recipients: ['matt@bishoptech.dev']
        })
        .eq('id', savedReport.id);

      return NextResponse.json({
        success: true,
        message: `📧 Comprehensive repository report for "${testRepo.name}" has been sent to matt@bishoptech.dev!`,
        data: {
          repository: testRepo.name,
          reportId: savedReport.id,
          messageId: emailResult.messageId,
          metrics: {
            totalSizeKB: reportData.performanceMetrics.repository_size?.total_size_kb || 0,
            linesOfCode: reportData.performanceMetrics.repository_size?.lines_of_code || 0,
            languages: reportData.performanceMetrics.language_breakdown?.length || 0,
            contributors: reportData.performanceMetrics.collaboration_metrics?.total_contributors || 0,
            complexityScore: reportData.performanceMetrics.code_quality?.complexity_score || 0
          }
        }
      });
    } else {
      throw new Error(emailResult.error || 'Failed to send email');
    }
  } catch (error: any) {
    console.error('Failed to send test report:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
