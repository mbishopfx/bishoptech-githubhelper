import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId = '550e8400-e29b-41d4-a716-446655440000' } = await request.json();
    
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken || githubToken === 'your_github_token_here') {
      return NextResponse.json({
        success: false,
        error: 'GitHub token not configured'
      }, { status: 400 });
    }

    const octokit = new Octokit({ auth: githubToken });
    
    console.log('🔍 Fetching all repositories...');
    
    // Get ALL repositories (public and private)
    const allRepos = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
        visibility: 'all',
        sort: 'updated',
        per_page: 100,
        page: page
      });
      
      if (repos.length === 0) {
        hasMore = false;
      } else {
        allRepos.push(...repos);
        page++;
        console.log(`📦 Fetched page ${page - 1}: ${repos.length} repositories`);
      }
    }
    
    console.log(`✅ Total repositories found: ${allRepos.length}`);
    
    // Import repositories into database
    const imported = [];
    const skipped = [];
    const errors = [];
    
    for (const repo of allRepos) {
      try {
        // Check if repository already exists
        const { data: existing } = await supabase
          .from('repositories')
          .select('id')
          .eq('github_id', repo.id)
          .single();
        
        if (existing) {
          skipped.push(repo.full_name);
          continue;
        }
        
        // Analyze tech stack based on language and topics
        const techStack = {
          primary_language: repo.language,
          topics: repo.topics || [],
          size_kb: repo.size,
          default_branch: repo.default_branch,
          private: repo.private,
        };
        
        // Insert repository with all required fields
        const { error: insertError } = await supabase
          .from('repositories')
          .insert({
            user_id: userId,
            github_id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            private: repo.private,
            html_url: repo.html_url,
            clone_url: repo.clone_url, // Required field
            language: repo.language,
            languages: {}, // Empty object for now
            topics: repo.topics || [],
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            open_issues: repo.open_issues_count,
            default_branch: repo.default_branch || 'main',
            tech_stack: techStack,
            analysis_summary: `${repo.language || 'Unknown'} project with ${repo.stargazers_count} stars`,
            is_active: true,
          });
        
        if (insertError) {
          console.error(`❌ Error importing ${repo.full_name}:`, insertError);
          errors.push({ repo: repo.full_name, error: insertError.message });
        } else {
          imported.push({
            name: repo.full_name,
            language: repo.language,
            stars: repo.stargazers_count,
            private: repo.private,
          });
          console.log(`✅ Imported: ${repo.full_name}`);
        }
        
      } catch (error: any) {
        console.error(`❌ Error processing ${repo.full_name}:`, error);
        errors.push({ repo: repo.full_name, error: error.message });
      }
    }
    
    // Summary
    const summary = {
      total_found: allRepos.length,
      imported: imported.length,
      skipped: skipped.length,
      errors: errors.length,
    };
    
    console.log('\n📊 Import Summary:');
    console.log(`  Total found: ${summary.total_found}`);
    console.log(`  Imported: ${summary.imported}`);
    console.log(`  Skipped: ${summary.skipped}`);
    console.log(`  Errors: ${summary.errors}`);
    
    return NextResponse.json({
      success: true,
      summary,
      imported: imported.slice(0, 10), // First 10 for preview
      skipped: skipped.slice(0, 5),
      errors: errors.slice(0, 5),
      message: `Successfully imported ${imported.length} repositories!`
    });

  } catch (error: any) {
    console.error('❌ Import Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.status ? `GitHub API returned ${error.status}` : 'Unknown error'
    }, {
      status: error.status || 500
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get repository statistics
    const { data: stats } = await supabase
      .from('repositories')
      .select('id, name, language, stars, is_active')
      .eq('is_active', true);
    
    const languageStats = stats?.reduce((acc: any, repo) => {
      const lang = repo.language || 'Unknown';
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {}) || {};
    
    const totalStars = stats?.reduce((sum, repo) => sum + (repo.stars || 0), 0) || 0;
    
    return NextResponse.json({
      success: true,
      total_repositories: stats?.length || 0,
      languages: languageStats,
      total_stars: totalStars,
      repositories: stats?.slice(0, 10) || [] // First 10 for preview
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}