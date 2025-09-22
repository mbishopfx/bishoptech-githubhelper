import { NextRequest, NextResponse } from 'next/server';
import { repoAnalyzerGraph } from '@/lib/agents/graphs/repo-analyzer';
import { db } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repositoryId, github_url, force_refresh = false } = body;

    if (!repositoryId && !github_url) {
      return NextResponse.json(
        { error: 'Repository ID or GitHub URL is required' },
        { status: 400 }
      );
    }

    // Check cache first (unless force refresh)
    if (!force_refresh && repositoryId) {
      const cached = await db.getFromCache(repositoryId, 'full_analysis', 'latest');
      if (cached.data) {
        return NextResponse.json({
          success: true,
          data: cached.data,
          from_cache: true,
        });
      }
    }

    // Execute the repository analyzer graph
    const result = await repoAnalyzerGraph.execute({
      repositoryId,
      github_url,
      force_refresh,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.results,
        execution_time: result.execution_time,
        steps: result.steps,
        from_cache: false,
      });
    } else {
      return NextResponse.json(
        { 
          error: 'Analysis failed', 
          details: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Repository analysis API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repositoryId = searchParams.get('repositoryId');

    if (!repositoryId) {
      return NextResponse.json(
        { error: 'Repository ID is required' },
        { status: 400 }
      );
    }

    // Get cached analysis
    const cached = await db.getFromCache(repositoryId, 'full_analysis', 'latest');
    
    if (cached.data) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        from_cache: true,
      });
    }

    // Get repository info
    const { data: repository, error } = await db.getRepository(repositoryId);
    
    if (error || !repository) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        repository,
        analysis_summary: repository.analysis_summary,
        tech_stack: repository.tech_stack,
        last_analyzed: repository.last_analyzed,
      },
      from_cache: false,
    });
  } catch (error) {
    console.error('Get repository analysis API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
