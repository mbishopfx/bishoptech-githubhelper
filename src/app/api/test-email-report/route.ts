import { NextResponse } from 'next/server';
import { REPOSITORY_REPORT_TEMPLATE } from '@/lib/email-templates';
import { EmailTemplateRenderer } from '@/lib/email';
import { getSingleUserId } from '@/lib/single-user';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const userId = getSingleUserId();
    
    // Get email settings for branding
    const { data: emailSettings } = await supabase
      .from('email_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Sample comprehensive repository data
    const sampleData = {
      // Repository basic info
      repository_name: 'next-js-enterprise-app',
      period_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      period_end: new Date().toLocaleDateString(),
      
      // Repository size and complexity
      total_size_kb: '1,847',
      lines_of_code: '32,156',
      file_count: '487',
      complexity_score: '78',
      
      // Commit activity metrics
      commit_count: '23',
      total_lines_changed: '4,892',
      total_lines_added: '3,147',
      total_lines_removed: '1,745',
      avg_commits_per_day: '3.3',
      
      // Issues and PRs
      issues_resolved: 8,
      prs_merged: 5,
      
      // Language breakdown
      language_breakdown: [
        { language: 'TypeScript', percentage: 68.4 },
        { language: 'JavaScript', percentage: 18.2 },
        { language: 'CSS', percentage: 8.7 },
        { language: 'HTML', percentage: 3.1 },
        { language: 'Markdown', percentage: 1.6 }
      ],
      
      // Code quality metrics
      maintainability_index: 89,
      test_coverage: 87,
      security_score: 94,
      technical_debt_ratio: 6.2,
      
      // File activity
      most_active_files: [
        { filename: 'src/components/Dashboard.tsx', changes: 12 },
        { filename: 'src/lib/api/reports.ts', changes: 8 },
        { filename: 'src/app/dashboard/page.tsx', changes: 6 },
        { filename: 'src/types/database.ts', changes: 5 },
        { filename: 'tailwind.config.ts', changes: 4 },
        { filename: 'src/lib/email.ts', changes: 3 },
        { filename: 'package.json', changes: 2 },
        { filename: 'next.config.ts', changes: 1 }
      ],
      
      // Team collaboration
      top_contributors: [
        { author: 'John Developer', commit_count: 12, lines_added: 1847, lines_removed: 423 },
        { author: 'Sarah Engineer', commit_count: 7, lines_added: 987, lines_removed: 234 },
        { author: 'Mike Architect', commit_count: 4, lines_added: 313, lines_removed: 1088 }
      ],
      total_contributors: 5,
      active_contributors: 3,
      bus_factor: 2,
      activity_score: 92,
      
      // Executive summary and recommendations
      summary: 'Exceptional development velocity this week with 23 high-quality commits across core features. The team delivered significant improvements to the dashboard architecture while maintaining excellent code quality standards. TypeScript adoption continues to strengthen codebase reliability, and test coverage remains above industry standards.',
      recommendations: [
        'Consider refactoring the authentication module to reduce complexity score',
        'Implement automated dependency updates to maintain security posture',
        'Add integration tests for the new reporting features',
        'Document the new API endpoints for team knowledge sharing',
        'Review and optimize bundle size for improved performance'
      ],
      
      // Branding (use defaults if not configured)
      company_name: emailSettings?.company_name || 'GitHub Helper',
      logo_url: emailSettings?.logo_url || '/whitelogo.png',
      primary_color: emailSettings?.primary_color || '#3b82f6',
    };

    // Render the email template
    const htmlContent = EmailTemplateRenderer.render(
      REPOSITORY_REPORT_TEMPLATE,
      sampleData
    );

    return new Response(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error: any) {
    console.error('Failed to generate test email report:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
