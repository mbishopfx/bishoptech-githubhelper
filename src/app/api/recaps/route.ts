import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Octokit } from '@octokit/rest';
import { getRepositoryDeploymentStatus } from '@/lib/vercel';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// GET - Fetch all recaps for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '550e8400-e29b-41d4-a716-446655440000'; // Demo user
    const repositoryId = searchParams.get('repositoryId');

    let query = supabase
      .from('recaps')
      .select(`
        *,
        repository:repositories(name, full_name, html_url)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (repositoryId) {
      query = query.eq('repository_id', repositoryId);
    }

    const { data: recaps, error } = await query;

    if (error) {
      console.error('Error fetching recaps:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      recaps: recaps || []
    });

  } catch (error: any) {
    console.error('Recaps API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Generate AI recap for repository
export async function POST(request: NextRequest) {
  try {
    const { repositoryId, timeRange = 'week', userId = '550e8400-e29b-41d4-a716-446655440000' } = await request.json();

    if (!repositoryId) {
      return NextResponse.json({ success: false, error: 'Repository ID is required' }, { status: 400 });
    }

    // Get repository details
    const { data: repository, error: repoError } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', repositoryId)
      .single();

    if (repoError || !repository) {
      return NextResponse.json({ success: false, error: 'Repository not found' }, { status: 404 });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Fetch GitHub data for the repository
    let githubData = {
      commits: 0,
      issues_closed: 0,
      prs_merged: 0,
      lines_changed: 0,
      recent_commits: [] as any[],
      recent_issues: [] as any[],
      recent_prs: [] as any[]
    };

    try {
      const [owner, repo] = repository.full_name.split('/');
      
      // Get recent commits
      const { data: commits } = await octokit.repos.listCommits({
        owner,
        repo,
        since: startDate.toISOString(),
        until: endDate.toISOString(),
        per_page: 100
      });

      // Get recent issues (closed)
      const { data: issues } = await octokit.issues.listForRepo({
        owner,
        repo,
        state: 'closed',
        since: startDate.toISOString(),
        per_page: 50
      });

      // Get recent pull requests
      const { data: prs } = await octokit.pulls.list({
        owner,
        repo,
        state: 'closed',
        sort: 'updated',
        direction: 'desc',
        per_page: 50
      });

      // Filter PRs that were merged in the time range
      const mergedPrs = prs.filter(pr => 
        pr.merged_at && 
        new Date(pr.merged_at) >= startDate && 
        new Date(pr.merged_at) <= endDate
      );

      // Calculate lines changed from commits
      let totalLinesChanged = 0;
      for (const commit of commits.slice(0, 20)) { // Limit to avoid API rate limits
        try {
          const { data: commitDetail } = await octokit.repos.getCommit({
            owner,
            repo,
            ref: commit.sha
          });
          totalLinesChanged += (commitDetail.stats?.additions || 0) + (commitDetail.stats?.deletions || 0);
        } catch (e) {
          // Skip individual commit failures
        }
      }

      githubData = {
        commits: commits.length,
        issues_closed: issues.filter(issue => !issue.pull_request).length,
        prs_merged: mergedPrs.length,
        lines_changed: totalLinesChanged,
        recent_commits: commits.slice(0, 10),
        recent_issues: issues.slice(0, 10),
        recent_prs: mergedPrs.slice(0, 10)
      };

    } catch (githubError) {
      console.error('Error fetching GitHub data:', githubError);
      // Continue with default values if GitHub API fails
    }

    // Get deployment status and information
    const deploymentInfo = await getRepositoryDeploymentStatus(repository);
    console.log(`Deployment info for ${repository.full_name}:`, deploymentInfo);

    // Generate AI summary based on the data including deployment info
    const summary = generateAISummary(repository, githubData, timeRange, deploymentInfo);
    const keyUpdates = generateKeyUpdates(githubData, deploymentInfo);
    const actionItems = generateActionItems(repository, githubData, deploymentInfo);

    // Create recap in database
    const { data: recap, error: recapError } = await supabase
      .from('recaps')
      .insert({
        user_id: userId,
        repository_id: repositoryId,
        title: `${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}ly Update - ${repository.name}`,
        summary,
        period: timeRange,
        key_updates: keyUpdates,
        action_items: actionItems,
        metrics: {
          commits: githubData.commits,
          issues_closed: githubData.issues_closed,
          prs_merged: githubData.prs_merged,
          lines_changed: githubData.lines_changed,
          deployment: deploymentInfo
        },
        date_range: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        generated_by: 'ai'
      })
      .select()
      .single();

    if (recapError) {
      return NextResponse.json({ success: false, error: recapError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${timeRange}ly recap for ${repository.name}`,
      recap: {
        ...recap,
        repository: {
          name: repository.name,
          full_name: repository.full_name,
          html_url: repository.html_url
        }
      }
    });

  } catch (error: any) {
    console.error('Generate Recap API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function generateAISummary(repository: any, githubData: any, timeRange: string, deploymentInfo?: any): string {
  const timeLabel = timeRange === 'week' ? 'This week' : timeRange === 'month' ? 'This month' : 'This quarter';
  
  let summary = `${timeLabel} showed `;
  
  if (githubData.commits > 10) {
    summary += 'strong development momentum ';
  } else if (githubData.commits > 0) {
    summary += 'steady progress ';
  } else {
    summary += 'a quieter period ';
  }
  
  summary += `with ${githubData.commits} commits, ${githubData.issues_closed} issues resolved, and ${githubData.prs_merged} pull requests merged. `;
  
  if (githubData.lines_changed > 1000) {
    summary += `Significant code changes were made with ${githubData.lines_changed.toLocaleString()} lines modified, indicating major feature development or refactoring. `;
  } else if (githubData.lines_changed > 100) {
    summary += `Moderate code changes totaling ${githubData.lines_changed} lines, suggesting steady feature development and bug fixes. `;
  }
  
  summary += `The team maintained focus on code quality and feature delivery for the ${repository.language || 'project'} codebase.`;
  
  // Add deployment status information
  if (deploymentInfo?.isDeployed) {
    summary += ` The project is actively deployed on ${deploymentInfo.deploymentPlatform || 'production'}`;
    if (deploymentInfo.productionUrl) {
      summary += ` and accessible at ${deploymentInfo.productionUrl}`;
    }
    if (deploymentInfo.lastDeployment) {
      const deployDate = new Date(deploymentInfo.lastDeployment.date).toLocaleDateString();
      summary += `. Latest deployment was on ${deployDate} with status: ${deploymentInfo.lastDeployment.status}`;
    }
    summary += '.';
  } else {
    summary += ' The project is not currently deployed to production.';
  }
  
  return summary;
}

function generateKeyUpdates(githubData: any, deploymentInfo?: any): string[] {
  const updates = [];
  
  if (githubData.commits > 0) {
    updates.push(`${githubData.commits} commits pushed with new features and improvements`);
  }
  
  if (githubData.issues_closed > 0) {
    updates.push(`${githubData.issues_closed} issues resolved and closed`);
  }
  
  if (githubData.prs_merged > 0) {
    updates.push(`${githubData.prs_merged} pull requests reviewed and merged`);
  }
  
  if (githubData.lines_changed > 0) {
    updates.push(`${githubData.lines_changed.toLocaleString()} lines of code modified across the codebase`);
  }
  
  // Add some generic updates based on activity
  if (githubData.recent_commits.length > 5) {
    updates.push('Active development with frequent commits and code improvements');
  }
  
  if (githubData.recent_prs.length > 2) {
    updates.push('Strong collaboration with multiple pull request reviews');
  }
  
  // Add deployment-related updates
  if (deploymentInfo?.isDeployed) {
    if (deploymentInfo.productionUrl) {
      updates.push(`Project is live and accessible at ${deploymentInfo.productionUrl}`);
    }
    if (deploymentInfo.lastDeployment) {
      updates.push(`Latest deployment completed successfully on ${deploymentInfo.deploymentPlatform || 'production'}`);
    }
  }

  if (updates.length === 0) {
    updates.push('Repository maintenance and monitoring continued');
  }
  
  return updates;
}

function generateActionItems(repository: any, githubData: any, deploymentInfo?: any): string[] {
  const items = [];
  
  if (githubData.commits > 20) {
    items.push('Consider creating a release candidate for recent changes');
    items.push('Update changelog and documentation for new features');
  }
  
  if (githubData.issues_closed < githubData.commits / 2) {
    items.push('Review and triage open issues for next iteration');
  }
  
  if (githubData.prs_merged > 5) {
    items.push('Review deployment pipeline for merged changes');
  }
  
  // Default action items
  items.push('Plan next development sprint priorities');
  items.push('Schedule team sync to discuss recent progress');
  
  if (repository.language) {
    items.push(`Review ${repository.language} best practices and code standards`);
  }

  // Add deployment-related action items
  if (!deploymentInfo?.isDeployed) {
    items.push('Set up deployment pipeline and production environment');
    items.push('Configure domain and deployment automation');
  } else if (deploymentInfo?.lastDeployment?.status !== 'READY') {
    items.push('Investigate and fix deployment issues');
  }
  
  return items.slice(0, 6); // Limit to 6 action items (increased for deployment items)
}
