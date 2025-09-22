import { NextRequest } from 'next/server';
import { withApiAuth, createApiResponse, createApiError } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import { Octokit } from '@octokit/rest';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const llm = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o',
  temperature: 0.2,
});

const github = new Octokit({ auth: process.env.GITHUB_TOKEN });

/**
 * GET /api/v1/recaps - List recaps
 */
export const GET = withApiAuth(async (request: NextRequest, context: any, auth: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get('project_id');
    const period = searchParams.get('period'); // daily, weekly, monthly
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    let query = supabase
      .from('recaps')
      .select(`
        *,
        repository:repositories(name, full_name, html_url)
      `)
      .eq('user_id', auth.user_id)
      .order('generated_at', { ascending: false })
      .limit(limit);

    if (project_id) {
      query = query.eq('repository_id', project_id);
    }

    if (period) {
      query = query.eq('period', period);
    }

    const { data: recaps, error } = await query;

    if (error) {
      return createApiError('Failed to fetch recaps', 500, 'FETCH_ERROR');
    }

    return createApiResponse({
      recaps,
      total: recaps?.length || 0
    });
  } catch (error) {
    console.error('GET /api/v1/recaps error:', error);
    return createApiError('Internal server error', 500);
  }
});

/**
 * POST /api/v1/recaps - Generate a new recap
 */
export const POST = withApiAuth(async (request: NextRequest, context: any, auth: any) => {
  try {
    const { 
      project_id, 
      period = 'weekly', 
      custom_context,
      include_commits = true,
      include_issues = true,
      include_prs = true,
      format = 'markdown'
    } = await request.json();

    if (!project_id) {
      return createApiError('project_id is required', 400, 'MISSING_PROJECT');
    }

    // Fetch repository
    const { data: repository, error: repoError } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', auth.user_id)
      .single();

    if (repoError || !repository) {
      return createApiError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'daily':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    // Gather repository data
    let githubData: any = {
      commits: [],
      issues: [],
      pullRequests: [],
      stats: { commits: 0, issues_closed: 0, prs_merged: 0, lines_changed: 0 }
    };

    if (process.env.GITHUB_TOKEN && repository.html_url) {
      try {
        const urlMatch = repository.html_url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (urlMatch) {
          const [, owner, repoName] = urlMatch;
          const cleanRepo = repoName.replace('.git', '');

          // Fetch commits
          if (include_commits) {
            const { data: commits } = await github.repos.listCommits({
              owner,
              repo: cleanRepo,
              since: startDate.toISOString(),
              until: endDate.toISOString(),
              per_page: 50
            });
            githubData.commits = commits;
            githubData.stats.commits = commits.length;
          }

          // Fetch issues
          if (include_issues) {
            const { data: issues } = await github.issues.listForRepo({
              owner,
              repo: cleanRepo,
              state: 'closed',
              since: startDate.toISOString(),
              per_page: 50
            });
            const filteredIssues = issues.filter(issue => !issue.pull_request);
            githubData.issues = filteredIssues;
            githubData.stats.issues_closed = filteredIssues.length;
          }

          // Fetch PRs
          if (include_prs) {
            const { data: prs } = await github.pulls.list({
              owner,
              repo: cleanRepo,
              state: 'closed',
              sort: 'updated',
              direction: 'desc',
              per_page: 50
            });
            const mergedPrs = prs.filter(pr => 
              pr.merged_at && 
              new Date(pr.merged_at) >= startDate && 
              new Date(pr.merged_at) <= endDate
            );
            githubData.pullRequests = mergedPrs;
            githubData.stats.prs_merged = mergedPrs.length;
          }
        }
      } catch (githubError) {
        console.warn('GitHub API error:', githubError);
      }
    }

    // Generate AI recap
    const aiPrompt = `
You are a technical project manager creating a comprehensive ${period} recap for a software project.

PROJECT DETAILS:
- Name: ${repository.name}
- Description: ${repository.description || 'No description'}
- Tech Stack: ${JSON.stringify(repository.tech_stack)}
- Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}

ACTIVITY DATA:
- Commits: ${githubData.stats.commits}
- Issues Closed: ${githubData.stats.issues_closed}
- PRs Merged: ${githubData.stats.prs_merged}

RECENT COMMITS:
${githubData.commits.slice(0, 10).map((c: any) => `- ${c.commit.message.split('\n')[0]} (${c.commit.author.name})`).join('\n')}

CLOSED ISSUES:
${githubData.issues.slice(0, 5).map((i: any) => `- #${i.number}: ${i.title}`).join('\n')}

MERGED PRS:
${githubData.pullRequests.slice(0, 5).map((pr: any) => `- #${pr.number}: ${pr.title}`).join('\n')}

ADDITIONAL CONTEXT:
${custom_context || 'No additional context provided'}

Create a professional ${period} recap with these sections:
1. ## Executive Summary (2-3 sentences)
2. ## Key Achievements (bullet points)
3. ## Development Activity (statistics and highlights)
4. ## Notable Changes (significant commits/features)
5. ## Issues Resolved (if any)
6. ## Action Items (3-5 next steps)

Format the response in ${format === 'markdown' ? 'Markdown' : 'plain text'} format.
Be specific, data-driven, and actionable. Focus on value delivered and progress made.
`;

    const aiResponse = await llm.invoke([new HumanMessage(aiPrompt)]);
    const summary = aiResponse.content as string;

    // Extract key updates and action items from the AI response
    const keyUpdates = [];
    const actionItems = [];
    
    if (githubData.stats.commits > 0) keyUpdates.push(`${githubData.stats.commits} commits made`);
    if (githubData.stats.issues_closed > 0) keyUpdates.push(`${githubData.stats.issues_closed} issues resolved`);
    if (githubData.stats.prs_merged > 0) keyUpdates.push(`${githubData.stats.prs_merged} pull requests merged`);
    
    actionItems.push('Review and prioritize next sprint tasks');
    actionItems.push('Update project documentation if needed');
    actionItems.push('Plan technical debt reduction activities');

    // Save recap to database
    const { data: recap, error: recapError } = await supabase
      .from('recaps')
      .insert({
        user_id: auth.user_id,
        repository_id: project_id,
        title: `${period.charAt(0).toUpperCase() + period.slice(1)}ly Update - ${repository.name}`,
        summary,
        period,
        key_updates: keyUpdates,
        action_items: actionItems,
        metrics: githubData.stats,
        date_range: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        generated_by: 'ai',
        period_start: startDate.toISOString(),
        period_end: endDate.toISOString(),
        generated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (recapError) {
      return createApiError('Failed to save recap', 500, 'SAVE_ERROR');
    }

    // Record agent execution
    await supabase.from('agent_executions').insert({
      user_id: auth.user_id,
      repository_id: project_id,
      agent_type: 'recap_generator',
      status: 'completed',
      input: { period, project_id, custom_context },
      output: { recap_id: recap.id, title: recap.title },
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      duration_ms: 5000,
    });

    return createApiResponse({
      recap: {
        ...recap,
        repository: {
          name: repository.name,
          full_name: repository.full_name,
          html_url: repository.html_url
        }
      },
      message: `${period.charAt(0).toUpperCase() + period.slice(1)}ly recap generated successfully`,
      github_data: githubData.stats
    }, 201);
  } catch (error) {
    console.error('POST /api/v1/recaps error:', error);
    return createApiError('Internal server error', 500);
  }
});
