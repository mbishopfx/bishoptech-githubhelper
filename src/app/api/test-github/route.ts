import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export async function GET(request: NextRequest) {
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    
    // Debug environment variables
    console.log('All env vars:', Object.keys(process.env).filter(key => key.includes('GITHUB')));
    console.log('GitHub token:', githubToken ? `${githubToken.substring(0, 10)}...` : 'NOT SET');
    
    if (!githubToken || githubToken === 'your_github_token_here') {
      return NextResponse.json({
        success: false,
        error: 'GitHub token not configured',
        debug: {
          token_present: !!githubToken,
          token_preview: githubToken ? `${githubToken.substring(0, 10)}...` : 'NOT SET',
          env_keys: Object.keys(process.env).filter(key => key.includes('GITHUB')),
        }
      });
    }

    const octokit = new Octokit({
      auth: githubToken,
    });

    // Test authentication and get user info
    const { data: user } = await octokit.rest.users.getAuthenticated();
    
    // Get user's repositories (including private ones)
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      visibility: 'all', // This gets both public and private
      sort: 'updated',
      per_page: 10, // Just get first 10 for testing
    });

    // Look for bishoptech-website repo specifically
    const { data: allRepos } = await octokit.rest.repos.listForAuthenticatedUser({
      visibility: 'all',
      sort: 'updated',
      per_page: 100, // Get more to find the specific repo
    });

    const bishopeechWebsite = allRepos.find(repo => 
      repo.name.toLowerCase().includes('bishoptech') && 
      repo.name.toLowerCase().includes('website')
    );

    let latestCommit = null;
    if (bishopeechWebsite) {
      try {
        // Get latest commit for bishoptech-website
        const { data: commits } = await octokit.rest.repos.listCommits({
          owner: bishopeechWebsite.owner.login,
          repo: bishopeechWebsite.name,
          per_page: 1,
        });
        latestCommit = commits[0];
      } catch (commitError) {
        console.error('Error getting commits:', commitError);
      }
    }

    return NextResponse.json({
      success: true,
      github_user: {
        login: user.login,
        name: user.name,
        email: user.email,
        public_repos: user.public_repos,
        total_private_repos: user.total_private_repos,
      },
      repositories: {
        total_found: repos.length,
        sample: repos.slice(0, 5).map(repo => ({
          name: repo.name,
          full_name: repo.full_name,
          private: repo.private,
          language: repo.language,
          updated_at: repo.updated_at,
        })),
      },
      bishoptech_website: bishopeechWebsite ? {
        found: true,
        name: bishopeechWebsite.name,
        full_name: bishopeechWebsite.full_name,
        private: bishopeechWebsite.private,
        language: bishopeechWebsite.language,
        updated_at: bishopeechWebsite.updated_at,
        latest_commit: latestCommit ? {
          sha: latestCommit.sha,
          message: latestCommit.commit.message,
          author: latestCommit.commit.author.name,
          date: latestCommit.commit.author.date,
          url: latestCommit.html_url,
        } : null,
      } : {
        found: false,
        searched_repos: allRepos.length,
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      details: {
        status: error.status,
        type: error.response?.data?.message || 'Unknown error'
      }
    }, {
      status: error.status || 500
    });
  }
}
