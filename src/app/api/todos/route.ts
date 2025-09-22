import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all todo lists for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '550e8400-e29b-41d4-a716-446655440000'; // Demo user
    const repositoryId = searchParams.get('repositoryId');

    let query = supabase
      .from('todo_lists')
      .select(`
        *,
        repository:repositories(name, full_name),
        items:todo_items(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (repositoryId) {
      query = query.eq('repository_id', repositoryId);
    }

    const { data: todoLists, error } = await query;

    if (error) {
      console.error('Error fetching todo lists:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      todoLists: todoLists || []
    });

  } catch (error: any) {
    console.error('Todos API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Create new todo list or generate AI todos
export async function POST(request: NextRequest) {
  try {
    const { type, userId = '550e8400-e29b-41d4-a716-446655440000', repositoryId, title, description, items } = await request.json();

    if (type === 'generate-ai') {
      // Generate AI todos for repository
      if (!repositoryId) {
        return NextResponse.json({ success: false, error: 'Repository ID is required for AI generation' }, { status: 400 });
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

      // TODO: Implement actual AI todo generation using LangGraph
      // For now, generate sample todos based on repository
      const aiTodos = [
        {
          title: `Optimize ${repository.language || 'code'} performance`,
          description: `Review and optimize performance bottlenecks in ${repository.name}`,
          priority: 'high',
          estimated_hours: 4
        },
        {
          title: 'Add comprehensive error handling',
          description: `Implement proper error handling throughout the ${repository.name} codebase`,
          priority: 'medium',
          estimated_hours: 6
        },
        {
          title: 'Update documentation',
          description: `Update README and code documentation for ${repository.name}`,
          priority: 'medium',
          estimated_hours: 2
        },
        {
          title: 'Add unit tests',
          description: `Increase test coverage for critical functions in ${repository.name}`,
          priority: 'high',
          estimated_hours: 8
        },
        {
          title: 'Security audit',
          description: `Perform security review and fix vulnerabilities in ${repository.name}`,
          priority: 'high',
          estimated_hours: 5
        }
      ];

      // Create todo list
      const { data: todoList, error: listError } = await supabase
        .from('todo_lists')
        .insert({
          user_id: userId,
          repository_id: repositoryId,
          title: `AI Generated Tasks - ${repository.name}`,
          description: `Automatically generated improvement tasks for ${repository.name}`,
          status: 'active'
        })
        .select()
        .single();

      if (listError) {
        return NextResponse.json({ success: false, error: listError.message }, { status: 500 });
      }

      // Create todo items
      const todoItems = aiTodos.map(item => ({
        todo_list_id: todoList.id,
        title: item.title,
        description: item.description,
        priority: item.priority,
        status: 'pending',
        estimated_hours: item.estimated_hours
      }));

      const { error: itemsError } = await supabase
        .from('todo_items')
        .insert(todoItems);

      if (itemsError) {
        return NextResponse.json({ success: false, error: itemsError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Generated ${aiTodos.length} AI todos for ${repository.name}`,
        todoList: { ...todoList, items: todoItems }
      });

    } else {
      // Create manual todo list
      const { data: todoList, error: listError } = await supabase
        .from('todo_lists')
        .insert({
          user_id: userId,
          repository_id: repositoryId,
          title: title || 'New Todo List',
          description: description || '',
          status: 'active'
        })
        .select()
        .single();

      if (listError) {
        return NextResponse.json({ success: false, error: listError.message }, { status: 500 });
      }

      // Create items if provided
      if (items && items.length > 0) {
        const todoItems = items.map((item: any) => ({
          todo_list_id: todoList.id,
          title: item.title,
          description: item.description || '',
          priority: item.priority || 'medium',
          status: 'pending'
        }));

        const { error: itemsError } = await supabase
          .from('todo_items')
          .insert(todoItems);

        if (itemsError) {
          return NextResponse.json({ success: false, error: itemsError.message }, { status: 500 });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Todo list created successfully',
        todoList
      });
    }

  } catch (error: any) {
    console.error('Create Todos API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
