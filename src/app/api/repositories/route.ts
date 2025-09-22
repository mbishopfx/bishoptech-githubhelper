import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all repositories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '550e8400-e29b-41d4-a716-446655440000'; // Demo user

    const { data: repositories, error } = await supabase
      .from('repositories')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching repositories:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      repositories: repositories || [],
      count: repositories?.length || 0
    });

  } catch (error: any) {
    console.error('Repositories API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Analyze repository (trigger AI analysis)
export async function POST(request: NextRequest) {
  try {
    const { repositoryId, analysisType } = await request.json();

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

    // TODO: Implement actual AI analysis using LangGraph agents
    // For now, we'll simulate analysis and update the repository
    const analysisData = {
      tech_stack: {
        primary_language: repository.language,
        frameworks: [],
        dependencies: [],
        complexity_score: Math.floor(Math.random() * 100),
        maintainability: Math.floor(Math.random() * 100),
        test_coverage: Math.floor(Math.random() * 100)
      },
      analysis_summary: `AI Analysis completed for ${repository.name}. This ${repository.language || 'unknown'} project shows good code structure and maintainability.`,
      last_analyzed: new Date().toISOString()
    };

    // Update repository with analysis
    const { error: updateError } = await supabase
      .from('repositories')
      .update(analysisData)
      .eq('id', repositoryId);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Repository analysis completed',
      analysis: analysisData
    });

  } catch (error: any) {
    console.error('Repository Analysis API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
