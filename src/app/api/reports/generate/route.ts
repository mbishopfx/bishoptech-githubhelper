import { NextRequest, NextResponse } from 'next/server';
import { reportGenerator } from '@/lib/report-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repositoryId, periodStart, periodEnd, options = {} } = body;

    // Validate required fields
    if (!repositoryId) {
      return NextResponse.json(
        { success: false, error: 'Repository ID is required' },
        { status: 400 }
      );
    }

    // Default to last 7 days if dates not provided
    const startDate = periodStart ? new Date(periodStart) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = periodEnd ? new Date(periodEnd) : new Date();

    // Generate the report
    const reportData = await reportGenerator.generateReport({
      repositoryId,
      periodStart: startDate,
      periodEnd: endDate,
      ...options
    });

    // Save the report to database
    const savedReport = await reportGenerator.saveReport(reportData, {
      repositoryId,
      periodStart: startDate,
      periodEnd: endDate,
      ...options
    });

    return NextResponse.json({
      success: true,
      message: 'Report generated successfully',
      data: {
        reportId: savedReport.id,
        report: reportData
      }
    });
  } catch (error: any) {
    console.error('Failed to generate report:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
