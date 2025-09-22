import { NextRequest } from 'next/server';
import { withApiAuth, createApiResponse, createApiError } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/v1/projects - List all projects/repositories for user
 */
export const GET = withApiAuth(async (request: NextRequest, context: any, auth: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const language = searchParams.get('language');

    let query = supabase
      .from('repositories')
      .select(`
        id,
        name,
        full_name,
        description,
        html_url,
        language,
        stars,
        forks,
        open_issues,
        tech_stack,
        analysis_summary,
        created_at,
        updated_at
      `)
      .eq('user_id', auth.user_id)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (language) {
      query = query.eq('language', language);
    }

    const { data: repositories, error, count } = await query;

    if (error) {
      return createApiError('Failed to fetch projects', 500, 'FETCH_ERROR');
    }

    return createApiResponse({
      projects: repositories,
      pagination: {
        total: count,
        limit,
        offset,
        has_more: count ? offset + limit < count : false
      }
    });
  } catch (error) {
    console.error('GET /api/v1/projects error:', error);
    return createApiError('Internal server error', 500);
  }
});

/**
 * POST /api/v1/projects - Import a new project from GitHub
 */
export const POST = withApiAuth(async (request: NextRequest, context: any, auth: any) => {
  try {
    const { github_url, auto_analyze = true } = await request.json();

    if (!github_url) {
      return createApiError('github_url is required', 400, 'MISSING_URL');
    }

    // Extract owner/repo from GitHub URL
    const urlMatch = github_url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!urlMatch) {
      return createApiError('Invalid GitHub URL format', 400, 'INVALID_URL');
    }

    const [, owner, repoName] = urlMatch;
    const cleanRepoName = repoName.replace('.git', '');

    // Check if repository already exists
    const { data: existing } = await supabase
      .from('repositories')
      .select('id, name')
      .eq('user_id', auth.user_id)
      .eq('full_name', `${owner}/${cleanRepoName}`)
      .single();

    if (existing) {
      return createApiError('Project already exists', 409, 'PROJECT_EXISTS');
    }

    // Import repository (simplified - in production, use GitHub API)
    const { data: newRepo, error: insertError } = await supabase
      .from('repositories')
      .insert({
        user_id: auth.user_id,
        name: cleanRepoName,
        full_name: `${owner}/${cleanRepoName}`,
        html_url: github_url,
        description: `Imported from ${github_url}`,
        language: 'Unknown',
        tech_stack: {},
        stars: 0,
        forks: 0,
        open_issues: 0
      })
      .select()
      .single();

    if (insertError) {
      return createApiError('Failed to import project', 500, 'IMPORT_ERROR');
    }

    // Trigger analysis if requested
    if (auto_analyze) {
      // Queue analysis job (implement async analysis)
      console.log(`Queuing analysis for project ${newRepo.id}`);
    }

    return createApiResponse({
      project: newRepo,
      message: 'Project imported successfully',
      analysis_queued: auto_analyze
    }, 201);
  } catch (error) {
    console.error('POST /api/v1/projects error:', error);
    return createApiError('Internal server error', 500);
  }
});
