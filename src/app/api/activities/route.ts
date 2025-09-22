import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch recent activities for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '550e8400-e29b-41d4-a716-446655440000'; // Demo user
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get recent activities from various sources
    const activities = [];

    // Get recent repository imports/updates
    const { data: recentRepos } = await supabase
      .from('repositories')
      .select('id, name, full_name, created_at, last_analyzed')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    recentRepos?.forEach(repo => {
      activities.push({
        id: `repo-${repo.id}`,
        type: 'repository',
        title: 'Repository Imported',
        description: `${repo.full_name} added to dashboard`,
        repository: repo.name,
        timestamp: repo.created_at,
        icon: 'github'
      });

      if (repo.last_analyzed) {
        activities.push({
          id: `analysis-${repo.id}`,
          type: 'analysis',
          title: 'Repository Analysis Completed',
          description: `AI analysis finished for ${repo.name}`,
          repository: repo.name,
          timestamp: repo.last_analyzed,
          icon: 'sparkles'
        });
      }
    });

    // Get recent todo lists
    const { data: recentTodos } = await supabase
      .from('todo_lists')
      .select(`
        id, title, created_at,
        repository:repositories(name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    recentTodos?.forEach(todo => {
      activities.push({
        id: `todo-${todo.id}`,
        type: 'todo',
        title: 'Todo List Created',
        description: todo.title,
        repository: todo.repository?.name,
        timestamp: todo.created_at,
        icon: 'list-todo'
      });
    });

    // Get recent recaps
    const { data: recentRecaps } = await supabase
      .from('recaps')
      .select(`
        id, title, created_at, period,
        repository:repositories(name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    recentRecaps?.forEach(recap => {
      activities.push({
        id: `recap-${recap.id}`,
        type: 'recap',
        title: 'Recap Generated',
        description: `${recap.period}ly summary for ${recap.repository?.name}`,
        repository: recap.repository?.name,
        timestamp: recap.created_at,
        icon: 'bar-chart'
      });
    });

    // Sort all activities by timestamp and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      activities: sortedActivities
    });

  } catch (error: any) {
    console.error('Activities API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
